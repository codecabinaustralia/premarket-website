import { NextResponse } from 'next/server';
import { sendPropertyApprovalEmail, sendPropertyAgentEmail } from '../services/resendService';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const { email, name, address } = await request.json();

    if (!email || !address) {
      return NextResponse.json({ error: 'Missing email or address' }, { status: 400 });
    }

    if (type === 'agent') {
      await sendPropertyAgentEmail(email, name, address);
      return NextResponse.json({ success: true, message: 'Agent email sent' });
    }

    // Default to approval email
    await sendPropertyApprovalEmail(email, name, address);
    return NextResponse.json({ success: true, message: 'Approval email sent' });
  } catch (err) {
    console.error('Error sending email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
