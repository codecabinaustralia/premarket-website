import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '../../middleware/auth';
import { adminDb } from '../../../firebase/adminApp';
import { normalizePhone } from '../../services/twilioService';

export const runtime = 'nodejs';

/**
 * Save or update an agent's SMS settings. Normalizes the phone to E.164
 * so the Twilio webhook can match it. The caller may only modify their
 * own user doc (we always write to auth.uid, never a body-provided uid).
 */
export async function POST(request) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { smsPhone, smsEnabled } = payload || {};

  const updates = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (smsPhone !== undefined) {
    if (smsPhone === null || smsPhone === '') {
      updates.smsPhone = null;
    } else {
      const normalized = normalizePhone(smsPhone);
      if (!normalized) {
        return NextResponse.json(
          { error: 'Invalid phone number. Use E.164 format (e.g. +61412345678).' },
          { status: 400 }
        );
      }

      // Prevent two accounts from claiming the same number
      const existing = await adminDb
        .collection('users')
        .where('smsPhone', '==', normalized)
        .limit(2)
        .get();
      const conflict = existing.docs.find((d) => d.id !== auth.uid);
      if (conflict) {
        return NextResponse.json(
          { error: 'That phone number is already linked to another Premarket account.' },
          { status: 409 }
        );
      }

      updates.smsPhone = normalized;
    }
  }

  if (smsEnabled !== undefined) {
    updates.smsEnabled = !!smsEnabled;
  }

  await adminDb.collection('users').doc(auth.uid).set(updates, { merge: true });

  return NextResponse.json({
    success: true,
    smsPhone: updates.smsPhone ?? null,
    smsEnabled: updates.smsEnabled ?? null,
  });
}
