import { NextResponse } from 'next/server';
import { verifyAuth } from '../middleware/auth';
import { sendPropertyLiveEmail, sendPropertyAgentEmail } from '../services/resendService';

export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const { email, name, address, visibility } = await request.json();

    if (!email || !address) {
      return NextResponse.json({ error: 'Missing email or address' }, { status: 400 });
    }

    if (type === 'agent') {
      await sendPropertyAgentEmail(email, name, address);
      return NextResponse.json({ success: true, message: 'Agent email sent' });
    }

    // Default to property live email (was approval email)
    await sendPropertyLiveEmail(email, name, address, visibility);
    return NextResponse.json({ success: true, message: 'Property live email sent' });
  } catch (err) {
    console.error('Error sending email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
