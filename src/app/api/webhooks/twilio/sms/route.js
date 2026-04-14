import { NextResponse, after } from 'next/server';
import { verifySignature, sendSms } from '../../../services/twilioService';
import { findSenderByPhone } from '../../../services/userLookupService';
import { handleInboundSms } from '../../../services/smsHandlerService';
import { normalizeE164 } from '../../../../utils/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Empty TwiML — tells Twilio we received the message and won't reply inline.
// The real reply goes out via the Twilio REST API from handleInboundSms.
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response/>';
const TWIML_HEADERS = { 'Content-Type': 'text/xml' };

export async function POST(request) {
  try {
    const signature = request.headers.get('x-twilio-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 403 });
    }

    // Parse form-encoded body once and reuse for signature verification.
    const rawBody = await request.text();
    const params = Object.fromEntries(new URLSearchParams(rawBody).entries());

    // Reconstruct the full public URL Twilio signed. Prefer x-forwarded-*
    // headers when present (Vercel / proxies) so the signature matches.
    const url = resolveRequestUrl(request);

    if (!verifySignature(signature, url, params)) {
      console.warn('[twilio/sms] signature mismatch', { url });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const rawFrom = params.From;
    const body = params.Body || '';
    const messageSid = params.MessageSid || null;

    if (!rawFrom) {
      return new NextResponse(EMPTY_TWIML, { status: 200, headers: TWIML_HEADERS });
    }

    // Normalize the phone once so downstream services all see E.164 even
    // if Twilio ever hands us a slightly different format (spaces, parens).
    const from = normalizeE164(rawFrom) || rawFrom;

    // Silently ignore unknown senders so Twilio doesn't retry and we
    // don't spam replies at random numbers. Checks users first, then
    // agents (team member sub-profiles) under findSenderByPhone.
    const sender = await findSenderByPhone(from);
    if (!sender) {
      console.log('[twilio/sms] unknown sender, ignoring', { from });
      return new NextResponse(EMPTY_TWIML, { status: 200, headers: TWIML_HEADERS });
    }

    // Defer all real work so we ACK within Twilio's 15s window. Any error
    // inside handleInboundSms is surfaced back to the sender via SMS so
    // we can iterate during the beta.
    after(() =>
      handleInboundSms({ sender, body, messageSid }).catch(async (err) => {
        console.error('[twilio/sms] async handler error:', err);
        try {
          await sendSms(
            from,
            `Sorry ${sender.senderName || 'there'} — something went wrong processing your message.\n\n[debug] ${err?.message || 'unknown error'}`
          );
        } catch (sendErr) {
          console.error('[twilio/sms] fallback sendSms failed:', sendErr);
        }
      })
    );

    return new NextResponse(EMPTY_TWIML, { status: 200, headers: TWIML_HEADERS });
  } catch (err) {
    console.error('[twilio/sms] webhook error:', err);
    // Still return 200 TwiML so Twilio doesn't retry. Internal logs capture the failure.
    return new NextResponse(EMPTY_TWIML, { status: 200, headers: TWIML_HEADERS });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

function resolveRequestUrl(request) {
  const urlObj = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto') || urlObj.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || urlObj.host;
  return `${proto}://${host}${urlObj.pathname}${urlObj.search}`;
}
