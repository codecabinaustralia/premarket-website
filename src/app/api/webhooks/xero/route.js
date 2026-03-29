import { NextResponse } from 'next/server';
import { updateInvoiceInFirestore, updateInvoiceRunItem } from '../../services/xeroService';
import crypto from 'crypto';

const WEBHOOK_KEY = process.env.XERO_WEBHOOK_KEY;

export async function POST(request) {
  try {
    const signature = request.headers.get('x-xero-signature');
    const rawBody = Buffer.from(await request.arrayBuffer());

    if (!signature || !rawBody) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const hmac = crypto
      .createHmac('sha256', WEBHOOK_KEY)
      .update(rawBody)
      .digest('base64');

    if (signature !== hmac) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody.toString());

    // Intent to Receive handshake
    if (Array.isArray(payload.events) && payload.events.length === 0 && payload.entropy) {
      return new NextResponse(null, { status: 200 });
    }

    // Process real webhook events
    const invoices = (payload.events || []).map((e) => e.resourceId);
    for (const invoiceId of invoices) {
      // Update user invoices (existing behavior)
      await updateInvoiceInFirestore({ InvoiceID: invoiceId });

      // Also update invoiceRunItems if this invoice belongs to a run
      await updateInvoiceRunItem(invoiceId, { Status: 'PAID' });
    }

    return NextResponse.json({ success: true, count: invoices.length });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
