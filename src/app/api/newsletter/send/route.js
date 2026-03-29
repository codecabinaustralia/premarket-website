import { NextResponse } from 'next/server';
import { sendWeeklyBuyerNewsletters } from '../../services/newsletterService';

export const maxDuration = 300;

async function runNewsletter() {
  const results = await sendWeeklyBuyerNewsletters();
  return NextResponse.json({ success: true, message: 'Newsletter job completed', ...results });
}

/**
 * GET — called by Vercel cron (Saturday 9am AEST).
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return await runNewsletter();
  } catch (err) {
    console.error('Error sending newsletters:', err);
    return NextResponse.json({ error: 'Failed to send newsletters', details: err.message }, { status: 500 });
  }
}

/**
 * POST — called by admin manual trigger proxy.
 */
export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return await runNewsletter();
  } catch (err) {
    console.error('Error sending newsletters:', err);
    return NextResponse.json({ error: 'Failed to send newsletters', details: err.message }, { status: 500 });
  }
}
