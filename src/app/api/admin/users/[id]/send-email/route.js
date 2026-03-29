import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../firebase/adminApp';

async function verifyAdmin(adminUid) {
  if (!adminUid) return false;
  const doc = await adminDb.collection('users').doc(adminUid).get();
  return doc.exists && doc.data().superAdmin === true;
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { adminUid, emailType } = await request.json();

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userDoc = await adminDb.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const email = userData.email;
    if (!email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 });
    }

    const validTypes = ['password_reset', 'welcome', 'property_live', 'follow_up'];
    if (!validTypes.includes(emailType)) {
      return NextResponse.json({ error: `Invalid email type. Valid: ${validTypes.join(', ')}` }, { status: 400 });
    }

    // Dynamic import to avoid build-time failures
    const { sendEmail } = await import('../../../../services/resendService');

    let result;
    switch (emailType) {
      case 'password_reset': {
        const { getAuth } = await import('firebase-admin/auth');
        const resetLink = await getAuth().generatePasswordResetLink(email);
        result = await sendEmail({
          to: email,
          subject: 'Reset Your Password - Premarket',
          html: `<p>Hi ${userData.firstName || ''},</p><p>Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>This link expires in 1 hour.</p><p>— Premarket Team</p>`,
        });
        break;
      }
      case 'welcome': {
        result = await sendEmail({
          to: email,
          subject: 'Welcome to Premarket!',
          html: `<p>Hi ${userData.firstName || ''},</p><p>Welcome to Premarket! We're excited to have you on board.</p><p>— Premarket Team</p>`,
        });
        break;
      }
      case 'property_live': {
        result = await sendEmail({
          to: email,
          subject: 'Your Property is Live on Premarket',
          html: `<p>Hi ${userData.firstName || ''},</p><p>Your property listing is now live on Premarket and visible to buyers.</p><p>— Premarket Team</p>`,
        });
        break;
      }
      case 'follow_up': {
        result = await sendEmail({
          to: email,
          subject: 'How are things going? - Premarket',
          html: `<p>Hi ${userData.firstName || ''},</p><p>Just checking in to see how things are going with your Premarket experience. Let us know if you need anything!</p><p>— Premarket Team</p>`,
        });
        break;
      }
    }

    return NextResponse.json({ success: true, emailType, to: email });
  } catch (err) {
    console.error('Send email error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
