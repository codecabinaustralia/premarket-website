import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';
import { verifyAuth } from '../../middleware/auth';

/**
 * GET /api/buyer/liked-properties
 * Returns { likes: [{ propertyId, createdAt, property }] } for the current user.
 */
export async function GET(request) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const snap = await adminDb
      .collection('likes')
      .where('userId', '==', auth.uid)
      .get();

    const likes = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        propertyId: data.propertyId,
        createdAt: data.createdAt || null,
        createdAtMs:
          data.createdAt?.toMillis?.() ?? data.createdAt?._seconds * 1000 ?? 0,
        notes: typeof data.notes === 'string' ? data.notes : '',
        rating: typeof data.rating === 'number' ? data.rating : 0,
      };
    });

    // Sort newest first.
    likes.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

    // Batch-fetch property docs in groups of 30 (Firestore 'in' limit).
    const propertyIds = likes.map((l) => l.propertyId).filter(Boolean);
    const propsById = {};
    for (let i = 0; i < propertyIds.length; i += 30) {
      const batch = propertyIds.slice(i, i + 30);
      const batchSnap = await adminDb
        .collection('properties')
        .where('__name__', 'in', batch)
        .get();
      batchSnap.docs.forEach((d) => {
        propsById[d.id] = { id: d.id, ...d.data() };
      });
    }

    // Attach property docs, filter archived/hidden.
    const enriched = likes
      .map((l) => ({ ...l, property: propsById[l.propertyId] || null }))
      .filter((l) => {
        if (!l.property) return false;
        if (l.property.archived) return false;
        if (l.property.active === false) return false;
        return true;
      });

    return NextResponse.json({ likes: enriched });
  } catch (err) {
    console.error('GET /api/buyer/liked-properties error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
