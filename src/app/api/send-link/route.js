import { NextResponse } from 'next/server';
import { verifyAuth } from '../middleware/auth';
import { sendLink } from '../services/resendService';

export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { link, email } = await request.json();
    if (!email || !link) {
      return NextResponse.json({ error: 'Missing email or link' }, { status: 400 });
    }

    await sendLink(link, email);
    return NextResponse.json({ success: true, message: 'Link sent successfully' });
  } catch (err) {
    console.error('Error sending link:', err);
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 });
  }
}
