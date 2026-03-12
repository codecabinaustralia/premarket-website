import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../firebase/adminApp';
import { getAuth } from 'firebase-admin/auth';

async function verifyAdmin(adminUid) {
  if (!adminUid) return false;
  const doc = await adminDb.collection('users').doc(adminUid).get();
  return doc.exists && doc.data().superAdmin === true;
}

/**
 * POST /api/admin/users/[id]/reset-password
 * Send a password reset email via Firebase Auth.
 * Body: { adminUid }
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { adminUid } = await request.json();

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get user email from Firestore
    const userDoc = await adminDb.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = userDoc.data().email;
    if (!email) {
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    // Generate password reset link
    const auth = getAuth();
    const resetLink = await auth.generatePasswordResetLink(email);

    // Send via Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Premarket <no-reply@mail.premarket.homes>',
      to: email,
      subject: 'Reset your Premarket password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Reset your password</h2>
          <p style="color: #64748b; line-height: 1.6;">
            A password reset was requested for your Premarket account. Click the button below to set a new password.
          </p>
          <a href="${resetLink}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #e48900; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
          <p style="color: #94a3b8; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    console.error('Password reset error:', err);
    return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
  }
}
