import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { verifyAdmin } from '../../middleware/auth';

export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { label } = await request.json();

    const token = 'dl_' + crypto.randomBytes(16).toString('hex');

    await adminDb.collection('docLinks').doc(token).set({
      token,
      label: label || null,
      createdBy: auth.uid,
      createdAt: FieldValue.serverTimestamp(),
      active: true,
      sessionCount: 0,
    });

    return NextResponse.json({
      token,
      url: `https://premarket.homes/docs?t=${token}`,
    });
  } catch (err) {
    console.error('Create doc link error:', err);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const snapshot = await adminDb
      .collection('docLinks')
      .orderBy('createdAt', 'desc')
      .get();

    const EXPIRY_MS = 72 * 60 * 60 * 1000;
    const now = Date.now();

    const links = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAtDate = data.createdAt?.toDate?.();
      const createdAt = createdAtDate?.toISOString() || null;
      const expired = createdAtDate ? now - createdAtDate.getTime() > EXPIRY_MS : false;
      const expiresAt = createdAtDate
        ? new Date(createdAtDate.getTime() + EXPIRY_MS).toISOString()
        : null;
      return {
        ...data,
        createdAt,
        expired,
        expiresAt,
      };
    });

    return NextResponse.json({ links });
  } catch (err) {
    console.error('List doc links error:', err);
    return NextResponse.json({ error: 'Failed to list links' }, { status: 500 });
  }
}
