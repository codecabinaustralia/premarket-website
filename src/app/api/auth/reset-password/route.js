import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '../../../firebase/adminApp';
import { sendPasswordResetEmailTemplate } from '../../services/resendService';

/**
 * POST /api/auth/reset-password
 * Public endpoint — sends a branded password reset email via Resend.
 * Always returns success to avoid leaking whether an email exists.
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: true });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Look up user name for a personalised greeting
    let firstName = '';
    try {
      const usersSnap = await adminDb
        .collection('users')
        .where('email', '==', trimmedEmail)
        .limit(1)
        .get();

      if (!usersSnap.empty) {
        firstName = usersSnap.docs[0].data().firstName || '';
      }
    } catch (_) {
      // Continue without name
    }

    // Generate the reset link and send branded email
    try {
      const resetLink = await getAuth().generatePasswordResetLink(trimmedEmail);
      await sendPasswordResetEmailTemplate(trimmedEmail, firstName, resetLink);
    } catch (_) {
      // Silently fail — don't reveal if the email exists or not
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    // Still return success to avoid email enumeration
    return NextResponse.json({ success: true });
  }
}
