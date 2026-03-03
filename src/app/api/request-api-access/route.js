import { NextResponse } from 'next/server';
import { adminDb } from '../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Don't allow re-request if already approved or pending
    if (userData.apiAccess?.status === 'approved') {
      return NextResponse.json({ error: 'Already approved' }, { status: 400 });
    }
    if (userData.apiAccess?.status === 'pending') {
      return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
    }

    await userRef.set(
      {
        apiAccess: {
          status: 'pending',
          apiKey: null,
          requestedAt: FieldValue.serverTimestamp(),
          approvedAt: null,
          revokedAt: null,
        },
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, status: 'pending' });
  } catch (err) {
    console.error('Request API access error:', err);
    return NextResponse.json({ error: 'Failed to request access' }, { status: 500 });
  }
}
