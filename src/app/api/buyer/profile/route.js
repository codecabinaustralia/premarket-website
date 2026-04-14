import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../../../firebase/adminApp';
import { verifyAuth } from '../../middleware/auth';

/**
 * GET/PATCH the current buyer's profile.
 * Also keeps the legacy users.buyerMetrics sub-object in sync so the Flutter
 * app continues to work.
 */

export async function GET(request) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const doc = await adminDb.collection('users').doc(auth.uid).get();
    if (!doc.exists) {
      return NextResponse.json({ buyerProfile: null });
    }
    return NextResponse.json({
      buyerProfile: doc.data().buyerProfile || null,
    });
  } catch (err) {
    console.error('GET /api/buyer/profile error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

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

  // Allow the client to set these fields only.
  const allowedKeys = [
    'buyerTypes',
    'budgetMin',
    'budgetMax',
    'propertyTypes',
    'bedroomsMin',
    'timeline',
    'objectives',
    'notify',
    'onboardingComplete',
    'skipped',
    'preApprovalStatus', // 'none' | 'in_progress' | 'approved'
    'preApprovalAmount',
    'depositAvailable',
    'annualIncome',
  ];

  const buyerProfile = {};
  for (const k of allowedKeys) {
    if (k in body) buyerProfile[k] = body[k];
  }

  // Allow the client to update top-level profile fields that buyers can edit.
  const topLevelUpdates = {};
  if (typeof body.firstName === 'string') topLevelUpdates.firstName = body.firstName.trim();
  if (typeof body.lastName === 'string') topLevelUpdates.lastName = body.lastName.trim();
  if (typeof body.phone === 'string') topLevelUpdates.phone = body.phone.trim();

  buyerProfile.updatedAt = FieldValue.serverTimestamp();
  if (buyerProfile.onboardingComplete === true && !buyerProfile.completedAt) {
    buyerProfile.completedAt = FieldValue.serverTimestamp();
  }

  // Sync legacy buyerMetrics
  const buyerMetrics = {};
  if ('budgetMax' in buyerProfile) {
    const min = Number(buyerProfile.budgetMin || 0);
    const max = Number(buyerProfile.budgetMax || 0);
    buyerMetrics.budget = Math.round((min + max) / 2);
  }
  if (Array.isArray(buyerProfile.buyerTypes)) {
    buyerMetrics.cashBuyer = buyerProfile.buyerTypes.includes('cashBuyer');
    buyerMetrics.investor = buyerProfile.buyerTypes.includes('investor');
  }

  try {
    const ref = adminDb.collection('users').doc(auth.uid);

    // Build a properly-nested payload. set({merge:true}) does NOT interpret
    // dotted keys as nested paths — it writes them as literal field names
    // with dots in them — so the nested structure must be built explicitly.
    // Set-merge does deep-merge object maps, preserving sibling fields.
    const payload = {
      updatedAt: FieldValue.serverTimestamp(),
      ...topLevelUpdates,
    };
    if (Object.keys(buyerProfile).length > 0) {
      payload.buyerProfile = buyerProfile;
    }
    if (Object.keys(buyerMetrics).length > 0) {
      payload.buyerMetrics = buyerMetrics;
    }

    await ref.set(payload, { merge: true });

    const fresh = await ref.get();
    return NextResponse.json({
      buyerProfile: fresh.data()?.buyerProfile || null,
    });
  } catch (err) {
    console.error('PATCH /api/buyer/profile error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
