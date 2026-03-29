import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../middleware/auth';
import { adminDb } from '../../../../firebase/adminApp';

/**
 * POST — Apply an edited image to a property (replace in imageUrls array)
 * Body: { editId, propertyId, originalImageUrl, editedImageUrl }
 */
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const uid = auth.uid;

    const { editId, propertyId, originalImageUrl, editedImageUrl } = await request.json();

    if (!editId || !propertyId || !editedImageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the property exists and belongs to user
    const propDoc = await adminDb.collection('properties').doc(propertyId).get();
    if (!propDoc.exists) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const propData = propDoc.data();
    if (propData.userId !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Replace original image with edited version in imageUrls
    const imageUrls = [...(propData.imageUrls || [])];
    const index = imageUrls.indexOf(originalImageUrl);
    if (index >= 0) {
      imageUrls[index] = editedImageUrl;
    } else {
      imageUrls.push(editedImageUrl);
    }

    await adminDb.collection('properties').doc(propertyId).update({ imageUrls });

    // Mark edit as applied
    await adminDb.collection('image_edits').doc(editId).update({
      appliedToListing: true,
    });

    return NextResponse.json({ success: true, imageUrls });
  } catch (err) {
    console.error('Image edit apply error:', err);
    return NextResponse.json({ error: 'Failed to apply edit' }, { status: 500 });
  }
}
