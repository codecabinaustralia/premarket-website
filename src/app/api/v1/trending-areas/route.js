import { NextResponse } from 'next/server';
import { validateApiKey } from '../middleware';
import { adminDb } from '../../../firebase/adminApp';
import { getAllCachedScores } from '../scoreComputation';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit')) || 10, 50);

    // Try cached scores first — much faster than scanning all collections
    const cachedScores = await getAllCachedScores();
    if (cachedScores.length > 0) {
      const sorted = cachedScores
        .map((s) => ({
          suburb: s.suburb,
          state: s.state,
          properties: s.propertyCount || 0,
          buyerScore: s.buyerScore || 0,
          sellerScore: s.sellerScore || 0,
          stale: s.stale || false,
        }))
        .sort((a, b) => b.buyerScore - a.buyerScore);

      return NextResponse.json({
        trendingAreas: sorted.slice(0, limit),
        totalSuburbs: cachedScores.length,
        cached: true,
      });
    }

    // Fallback to full scan (original logic)
    const now = Date.now();
    const DAY_MS = 86400000;
    const thirtyDaysAgo = now - 30 * DAY_MS;
    const sixtyDaysAgo = now - 60 * DAY_MS;

    const propertiesSnap = await adminDb.collection('properties').get();
    const properties = propertiesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const suburbMap = {};
    for (const p of properties) {
      const key = extractSuburb(p);
      if (!key) continue;
      if (!suburbMap[key]) suburbMap[key] = [];
      suburbMap[key].push(p);
    }

    const [offersSnap, likesSnap] = await Promise.all([
      adminDb.collection('offers').get(),
      adminDb.collection('likes').get(),
    ]);

    const offers = offersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const likes = likesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const offersByProperty = groupBy(offers, 'propertyId');
    const likesByProperty = groupBy(likes, 'propertyId');

    const suburbScores = [];

    for (const [suburb, props] of Object.entries(suburbMap)) {
      const propertyIds = new Set(props.map((p) => p.id));

      const suburbOffers = [];
      const suburbLikes = [];
      for (const pid of propertyIds) {
        if (offersByProperty[pid]) suburbOffers.push(...offersByProperty[pid]);
        if (likesByProperty[pid]) suburbLikes.push(...likesByProperty[pid]);
      }

      const recentOpinions = suburbOffers.filter((o) => {
        const ts = toTimestamp(o.createdAt || o.updatedAt);
        return ts && ts >= thirtyDaysAgo;
      }).length;

      const recentLikes = suburbLikes.filter((l) => {
        const ts = toTimestamp(l.createdAt);
        return ts && ts >= thirtyDaysAgo;
      }).length;

      const priorOpinions = suburbOffers.filter((o) => {
        const ts = toTimestamp(o.createdAt || o.updatedAt);
        return ts && ts >= sixtyDaysAgo && ts < thirtyDaysAgo;
      }).length;

      const priorLikes = suburbLikes.filter((l) => {
        const ts = toTimestamp(l.createdAt);
        return ts && ts >= sixtyDaysAgo && ts < thirtyDaysAgo;
      }).length;

      const recentActivity = recentOpinions + recentLikes;
      const priorActivity = priorOpinions + priorLikes;

      let growthRate = 0;
      if (priorActivity > 0) {
        growthRate = ((recentActivity - priorActivity) / priorActivity) * 100;
      } else if (recentActivity > 0) {
        growthRate = 100;
      }

      suburbScores.push({
        suburb,
        properties: props.length,
        recentActivity,
        priorActivity,
        growthRate: Math.round(growthRate),
        recentOpinions,
        recentLikes,
      });
    }

    suburbScores.sort((a, b) => {
      if (b.growthRate !== a.growthRate) return b.growthRate - a.growthRate;
      return b.recentActivity - a.recentActivity;
    });

    return NextResponse.json({
      trendingAreas: suburbScores.slice(0, limit),
      period: {
        current: 'last 30 days',
        comparison: '30-60 days ago',
      },
      totalSuburbs: Object.keys(suburbMap).length,
    });
  } catch (err) {
    console.error('Trending areas error:', err);
    return NextResponse.json({ error: 'Failed to calculate trending areas' }, { status: 500 });
  }
}

function extractSuburb(property) {
  if (property.formattedAddress) {
    const parts = property.formattedAddress.split(',').map((s) => s.trim());
    if (parts.length >= 2) return parts[parts.length - 2];
  }
  if (property.suburb) return property.suburb;
  if (property.postcode) return property.postcode;
  return null;
}

function groupBy(arr, key) {
  const map = {};
  for (const item of arr) {
    const val = item[key];
    if (!val) continue;
    if (!map[val]) map[val] = [];
    map[val].push(item);
  }
  return map;
}

function toTimestamp(val) {
  if (!val) return null;
  if (val.toMillis) return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}
