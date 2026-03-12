import { NextResponse } from 'next/server';
import { adminDb } from '../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req) {
  try {
    const { propertyId, visitorId, isReturn } = await req.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
    }

    const propertyRef = adminDb.collection('properties').doc(propertyId);

    const updateData = {
      'stats.views': FieldValue.increment(1),
      'stats.lastViewed': FieldValue.serverTimestamp(),
    };

    if (isReturn) {
      updateData['stats.returnViews'] = FieldValue.increment(1);
    } else {
      updateData['stats.uniqueViews'] = FieldValue.increment(1);
    }

    await propertyRef.update(updateData);

    if (visitorId) {
      await adminDb.collection('propertyViews').add({
        propertyId,
        visitorId,
        isReturn: !!isReturn,
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
