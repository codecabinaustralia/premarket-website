import crypto from 'crypto';
import { normalizeE164 } from '../../utils/phone';

let _client;
function getTwilio() {
  if (!_client) {
    // Lazy require so the module can load even when twilio isn't installed
    // in local dev or the env vars aren't present at build time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require('twilio');
    _client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return _client;
}

/**
 * Send an outbound SMS via Twilio's REST API. Uses the team Twilio number
 * defined in TWILIO_PHONE_NUMBER. Returns the Message SID on success.
 */
export async function sendSms(to, body) {
  if (!to || !body) {
    throw new Error('sendSms: to and body are required');
  }
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    throw new Error('TWILIO_PHONE_NUMBER is not configured');
  }
  const truncated = smartTruncate(body);
  const msg = await getTwilio().messages.create({ to, from, body: truncated });
  return msg.sid;
}

/**
 * Verify a Twilio request signature.
 *
 * Twilio signs: `URL + concatenate(sortedKey + value)` using HMAC-SHA1
 * with the account auth token, base64 encoded. See
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security.
 */
export function verifySignature(signature, url, params) {
  if (!signature || !url || !params) return false;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + (params[key] ?? '');
  }

  const expected = crypto.createHmac('sha1', authToken).update(data).digest('base64');

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * SMS bodies are billed in segments (~153 chars each with concatenation).
 * Keep replies under ~10 segments so Twilio doesn't silently truncate or
 * burn credit. Truncates on a word boundary when possible.
 */
export function smartTruncate(text, maxLen = 1500) {
  if (!text) return '';
  const str = String(text);
  if (str.length <= maxLen) return str;
  const cut = str.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = lastSpace > maxLen * 0.8 ? cut.slice(0, lastSpace) : cut;
  return trimmed + '…';
}

/**
 * Back-compat re-export. Prefer `normalizeE164` from `src/app/utils/phone`.
 * Kept so existing callers in sms-settings route and older services keep
 * working without a sweeping rename.
 */
export const normalizePhone = normalizeE164;
