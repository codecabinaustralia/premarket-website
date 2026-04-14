import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../../../firebase/adminApp';
import { verifyAuth } from '../../middleware/auth';

/**
 * PATCH /api/buyer/like-meta
 *
 * Body: { propertyId: string, notes?: string, rating?: number }
 *
 * Updates personal-note metadata on the current user's like doc. The like doc
 * must exist (the user must have already liked the property). Like docs use
 * the deterministic id `{uid}_{propertyId}`.
 */
export async function PATCH(request) {
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

  const propertyId = String(body.propertyId || '').trim();
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }

  const updates = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof body.notes === 'string') {
    updates.notes = body.notes.slice(0, 2000);
  }
  if (typeof body.rating === 'number') {
    const r = Math.round(body.rating);
    if (r < 0 || r > 5) {
      return NextResponse.json({ error: 'rating must be 0-5' }, { status: 400 });
    }
    updates.rating = r;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
  }

  try {
    const likeId = `${auth.uid}_${propertyId}`;
    const ref = adminDb.collection('likes').doc(likeId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: 'Like not found — like the property first' },
        { status: 404 }
      );
    }
    if (snap.data().userId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ref.set(updates, { merge: true });
    const fresh = await ref.get();
    return NextResponse.json({ like: { id: fresh.id, ...fresh.data() } });
  } catch (err) {
    console.error('PATCH /api/buyer/like-meta error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
