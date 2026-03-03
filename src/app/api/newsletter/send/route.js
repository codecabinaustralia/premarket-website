import { NextResponse } from 'next/server';
import { sendWeeklyBuyerNewsletters } from '../../services/newsletterService';

export async function POST(request) {
  try {
    const results = await sendWeeklyBuyerNewsletters();
    return NextResponse.json({ success: true, message: 'Newsletter job completed', ...results });
  } catch (err) {
    console.error('Error sending newsletters:', err);
    return NextResponse.json({ error: 'Failed to send newsletters', details: err.message }, { status: 500 });
  }
}
