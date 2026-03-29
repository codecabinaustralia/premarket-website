import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../../../../firebase/adminApp';
import { verifyAdmin } from '../../../middleware/auth';

const EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    const doc = await adminDb.collection('docLinks').doc(token).get();

    if (!doc.exists || doc.data().active !== true) {
      return NextResponse.json({ valid: false });
    }

    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.();
    if (createdAt && Date.now() - createdAt.getTime() > EXPIRY_MS) {
      return NextResponse.json({ valid: false, expired: true });
    }

    const expiresAt = createdAt
      ? new Date(createdAt.getTime() + EXPIRY_MS).toISOString()
      : null;

    return NextResponse.json({ valid: true, expiresAt });
  } catch (err) {
    console.error('Validate doc link error:', err);
    return NextResponse.json({ valid: false });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { token } = await params;

    await adminDb.collection('docLinks').doc(token).update({
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset doc link error:', err);
    return NextResponse.json({ error: 'Failed to reset link' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { token } = await params;

    await adminDb.collection('docLinks').doc(token).update({ active: false });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Deactivate doc link error:', err);
    return NextResponse.json({ error: 'Failed to deactivate link' }, { status: 500 });
  }
}
