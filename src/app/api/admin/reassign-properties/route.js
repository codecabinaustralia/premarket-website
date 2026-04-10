import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../middleware/auth';
import { adminDb } from '../../../firebase/adminApp';

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { propertyIds, targetUserId } = await request.json();

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json({ error: 'propertyIds must be a non-empty array' }, { status: 400 });
    }
    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // Verify target user exists
    const targetUserDoc = await adminDb.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Batch update properties (Firestore batch limit is 500)
    const batches = [];
    for (let i = 0; i < propertyIds.length; i += 500) {
      const batch = adminDb.batch();
      const chunk = propertyIds.slice(i, i + 500);
      for (const propertyId of chunk) {
        const ref = adminDb.collection('properties').doc(propertyId);
        batch.update(ref, {
          userId: targetUserId,
          agentId: null,
          agentName: null,
          agentAvatar: null,
        });
      }
      batches.push(batch.commit());
    }

    await Promise.all(batches);

    return NextResponse.json({ success: true, count: propertyIds.length });
  } catch (err) {
    console.error('Reassign properties error:', err);
    return NextResponse.json({ error: 'Failed to reassign properties' }, { status: 500 });
  }
}
