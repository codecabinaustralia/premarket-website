import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';
import { verifyAuth } from '../../middleware/auth';

/**
 * GET /api/buyer/early-access
 *
 * Returns pre-market properties matching the current buyer's watched areas
 * and budget profile, plus a "days until public release" countdown.
 *
 * A property is considered "early access" when:
 *   - it is active, AND
 *   - either visibility === false (still in pre-market mode), OR
 *   - it has a future gotoMarketGoal date.
 */

const DAY_MS = 86400000;
const RESULT_LIMIT = 24;

function tsToMs(ts) {
  if (!ts) return null;
  if (typeof ts === 'number') return ts;
  if (ts.toMillis) return ts.toMillis();
  if (ts._seconds) return ts._seconds * 1000;
  if (ts.seconds) return ts.seconds * 1000;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function suburbMatch(propertySuburb, watchedSuburbs) {
  if (!watchedSuburbs.length) return true; // no filter → all pass
  if (!propertySuburb) return false;
  const lower = String(propertySuburb).toLowerCase();
  return watchedSuburbs.some((s) => lower.includes(s));
}

function withinBudget(price, min, max) {
  if (!price) return true; // unknown price → don't filter out
  if (max && price > max * 1.1) return false; // 10% wiggle
  if (min && price < min * 0.9) return false;
  return true;
}

function matchesPropertyType(p, allowedTypes) {
  if (!allowedTypes || !allowedTypes.length) return true;
  const t = (p.propertyType || p.type || '').toLowerCase();
  if (!t) return true;
  return allowedTypes.some((a) => t.includes(String(a).toLowerCase()));
}

export async function GET(request) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // 1. Load buyer profile + watched areas in parallel
    const [userDoc, areasSnap] = await Promise.all([
      adminDb.collection('users').doc(auth.uid).get(),
      adminDb.collection('watchedAreas').where('userId', '==', auth.uid).get(),
    ]);

    const profile = userDoc.exists ? userDoc.data().buyerProfile || {} : {};
    const budgetMin = Number(profile.budgetMin || 0);
    const budgetMax = Number(profile.budgetMax || 0);
    const propertyTypes = Array.isArray(profile.propertyTypes)
      ? profile.propertyTypes
      : [];
    const bedroomsMin = Number(profile.bedroomsMin || 0);

    const watchedAreas = areasSnap.docs.map((d) => d.data());
    const watchedSuburbs = watchedAreas
      .map((a) => (a.suburb || '').toLowerCase())
      .filter(Boolean);

    // 2. Pull active properties. We grab a generous slice and filter in-memory
    //    so we don't need composite indexes for every combo.
    const propsSnap = await adminDb
      .collection('properties')
      .where('active', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(300)
      .get();

    const now = Date.now();
    const matched = [];

    for (const doc of propsSnap.docs) {
      const p = { id: doc.id, ...doc.data() };
      if (p.archived) continue;
      if (p.listingStatus === 'on-market') continue;

      const gtmGoalMs = tsToMs(p.gotoMarketGoal);
      const isPremarket = p.visibility === false;
      const hasFutureGtm = gtmGoalMs && gtmGoalMs > now;

      // Must be either explicitly pre-market OR have a future go-to-market date
      if (!isPremarket && !hasFutureGtm) continue;

      // Profile filters
      if (!suburbMatch(p.suburb || p.address, watchedSuburbs)) continue;
      if (!withinBudget(Number(p.price || 0), budgetMin, budgetMax)) continue;
      if (!matchesPropertyType(p, propertyTypes)) continue;
      if (bedroomsMin && Number(p.bedrooms || 0) < bedroomsMin) continue;

      const daysUntilPublic = gtmGoalMs
        ? Math.max(0, Math.ceil((gtmGoalMs - now) / DAY_MS))
        : null;

      matched.push({
        id: p.id,
        address: p.formattedAddress || p.address || p.suburb || 'Property',
        suburb: p.suburb || null,
        state: p.state || null,
        price: p.price || null,
        bedrooms: p.bedrooms || null,
        bathrooms: p.bathrooms || null,
        carSpaces: p.carSpaces || null,
        propertyType: p.propertyType || p.type || null,
        imageUrl: p.imageUrls?.[0] || null,
        isPremarket,
        gotoMarketGoal: gtmGoalMs ? new Date(gtmGoalMs).toISOString() : null,
        daysUntilPublic,
        createdAt: tsToMs(p.createdAt),
      });
    }

    // 3. Sort: imminent go-to-market first, then newest pre-market
    matched.sort((a, b) => {
      if (a.daysUntilPublic != null && b.daysUntilPublic != null) {
        return a.daysUntilPublic - b.daysUntilPublic;
      }
      if (a.daysUntilPublic != null) return -1;
      if (b.daysUntilPublic != null) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return NextResponse.json({
      properties: matched.slice(0, RESULT_LIMIT),
      meta: {
        totalMatched: matched.length,
        watchedSuburbCount: watchedSuburbs.length,
        budgetMin,
        budgetMax,
        propertyTypes,
        bedroomsMin,
      },
    });
  } catch (err) {
    console.error('GET /api/buyer/early-access error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
