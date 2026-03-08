import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export async function PUT(request, { params }) {
  try {
    const { propertyId } = await params;
    const { uid, visibility } = await request.json();

    if (!uid || !propertyId || typeof visibility !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the property exists and belongs to this user
    const propDoc = await adminDb.collection('properties').doc(propertyId).get();
    if (!propDoc.exists) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const propData = propDoc.data();
    if (propData.userId !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update visibility
    await adminDb.collection('properties').doc(propertyId).update({
      visibility,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      propertyId,
      visibility,
    });
  } catch (err) {
    console.error('Agentbox toggle error:', err);
    return NextResponse.json({ error: 'Failed to toggle property' }, { status: 500 });
  }
}
