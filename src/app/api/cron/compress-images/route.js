import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';
import sharp from 'sharp';

export const maxDuration = 300;

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find properties that need compression:
    // - has imageUrls
    // - imagesCompressed is not true
    // - not currently uploading
    const snapshot = await adminDb
      .collection('properties')
      .where('imagesCompressed', '==', false)
      .limit(10)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No properties to compress', processed: 0 });
    }

    const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    let processed = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
      const property = doc.data();
      const propertyId = doc.id;

      // Skip if upload is still in progress
      if (property.imageUploadProgress?.inProgress === true) {
        skipped++;
        continue;
      }

      const imageUrls = property.imageUrls || [];
      if (imageUrls.length === 0) {
        // No images, just mark as compressed
        await doc.ref.update({ imagesCompressed: true });
        continue;
      }

      const compressedUrls = [];

      for (const url of imageUrls) {
        try {
          // Skip if already on Bunny CDN compressed path
          if (url.includes('premarketvideos.b-cdn.net/images/')) {
            compressedUrls.push(url);
            continue;
          }

          const response = await fetch(url);
          if (!response.ok) {
            compressedUrls.push(url);
            continue;
          }

          const buffer = Buffer.from(await response.arrayBuffer());

          const compressed = await sharp(buffer)
            .resize(2000, null, { withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

          const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
          const bunnyPath = `images/${propertyId}/${filename}`;

          const uploadRes = await fetch(
            `https://syd.storage.bunnycdn.com/premarketvideos/${bunnyPath}`,
            {
              method: 'PUT',
              headers: {
                'AccessKey': accessKey,
                'Content-Type': 'image/jpeg',
              },
              body: compressed,
            }
          );

          if (!uploadRes.ok) {
            compressedUrls.push(url);
            continue;
          }

          compressedUrls.push(`https://premarketvideos.b-cdn.net/${bunnyPath}`);
        } catch (err) {
          console.error(`Error compressing image for ${propertyId}:`, err);
          compressedUrls.push(url);
        }
      }

      await doc.ref.update({
        imageUrls: compressedUrls,
        imagesCompressed: true,
      });

      // Update draftProperties too
      const draftRef = adminDb.collection('draftProperties').doc(propertyId);
      const draftSnap = await draftRef.get();
      if (draftSnap.exists) {
        await draftRef.update({
          imageUrls: compressedUrls,
          imagesCompressed: true,
        });
      }

      processed++;
    }

    return NextResponse.json({ success: true, processed, skipped });
  } catch (err) {
    console.error('Compress cron error:', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
