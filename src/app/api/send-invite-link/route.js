import { NextResponse } from 'next/server';
import { verifyAuth } from '../middleware/auth';
import { sendInviteLink } from '../services/resendService';

export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { email, firstName, agentFirstName, link } = await request.json();
    if (!email || !firstName || !agentFirstName || !link) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sendInviteLink(email, firstName, agentFirstName, link);
    return NextResponse.json({ success: true, message: 'Invite sent successfully' });
  } catch (err) {
    console.error('Error sending invite link:', err);
    return NextResponse.json({ error: 'Failed to send invite link' }, { status: 500 });
  }
}
