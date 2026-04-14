import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../../../firebase/adminApp';
import { verifyAuth } from '../../middleware/auth';

/** GET /api/buyer/watched-areas - list current user's areas */
export async function GET(request) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const snap = await adminDb
      .collection('watchedAreas')
      .where('userId', '==', auth.uid)
      .get();

    const areas = snap.docs
      .map((d) => {
        const data = d.data();
        const createdAtMs =
          data.createdAt?.toMillis?.() ?? data.createdAt?._seconds * 1000 ?? 0;
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt || null,
          createdAtMs,
        };
      })
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

    return NextResponse.json({ areas });
  } catch (err) {
    console.error('GET /api/buyer/watched-areas error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** POST /api/buyer/watched-areas - add a new area */
export async function POST(request) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.placeName || typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return NextResponse.json(
      { error: 'placeName, lat, and lng are required' },
      { status: 400 }
    );
  }

  try {
    const doc = {
      userId: auth.uid,
      name: body.name || body.placeName,
      placeName: body.placeName,
      suburb: body.suburb || null,
      state: body.state || null,
      postcode: body.postcode || null,
      lat: body.lat,
      lng: body.lng,
      placeType: body.placeType || 'locality',
      radiusKm: Number(body.radiusKm) || 5,
      createdAt: FieldValue.serverTimestamp(),
    };

    const ref = await adminDb.collection('watchedAreas').add(doc);
    return NextResponse.json({ id: ref.id, ...doc, createdAt: null });
  } catch (err) {
    console.error('POST /api/buyer/watched-areas error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** DELETE /api/buyer/watched-areas?id=... - remove one */
export async function DELETE(request) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const ref = adminDb.collection('watchedAreas').doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (doc.data().userId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/buyer/watched-areas error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
