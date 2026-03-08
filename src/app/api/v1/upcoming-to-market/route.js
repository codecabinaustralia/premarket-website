import { NextResponse } from 'next/server';
import { validateApiKey } from '../middleware';
import { adminDb } from '../../../firebase/adminApp';

const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

function extractSuburbState(data) {
  let suburb = data.suburb || data.location?.suburb || '';
  let state = data.state || data.location?.state || '';
  if (suburb && state) return { suburb, state };

  const addr = typeof data.address === 'string' ? data.address : '';
  if (addr) {
    const parts = addr.split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      if (AU_STATES.includes(parts[i].toUpperCase())) {
        state = parts[i].toUpperCase();
        suburb = parts.slice(0, i).join(' ');
        if (suburb && state) return { suburb, state };
      }
    }
  }

  const formatted = data.formattedAddress || '';
  if (formatted) {
    const segments = formatted.split(',').map((s) => s.trim());
    for (const seg of segments) {
      const words = seg.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        if (AU_STATES.includes(words[i].toUpperCase())) {
          state = words[i].toUpperCase();
          const suburbWords = words.slice(0, i).filter((w) => !/^\d+$/.test(w));
          if (suburbWords.length > 0) {
            suburb = suburbWords.join(' ');
            return { suburb, state };
          }
        }
      }
    }
  }

  return { suburb: suburb || null, state: state || null };
}

function toTimestamp(val) {
  if (!val) return null;
  if (val.toMillis) return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const propsSnap = await adminDb.collection('properties').get();
    const now = Date.now();
    const DAY_MS = 86400000;

    // Collect all property data with extracted suburb/state
    const properties = [];
    const propertyIds = [];
    for (const doc of propsSnap.docs) {
      const data = { id: doc.id, ...doc.data() };
      const { suburb, state } = extractSuburbState(data);
      data._suburb = suburb;
      data._state = state;
      properties.push(data);
      propertyIds.push(doc.id);
    }

    // Fetch all offers in batches
    const allOffers = [];
    for (let i = 0; i < propertyIds.length; i += 30) {
      const batch = propertyIds.slice(i, i + 30);
      const snap = await adminDb.collection('offers').where('propertyId', 'in', batch).get();
      allOffers.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    // Index offers by propertyId
    const offersByProperty = {};
    for (const o of allOffers) {
      if (!offersByProperty[o.propertyId]) offersByProperty[o.propertyId] = [];
      offersByProperty[o.propertyId].push(o);
    }

    // Classify each property as "upcoming"
    const upcoming = [];
    for (const p of properties) {
      if (p.archived) continue;

      const offers = offersByProperty[p.id] || [];
      const opinions = offers.filter((o) => o.type === 'opinion');
      const seriousBuyers = opinions.filter((o) => o.serious === true);
      const gtmGoal = toTimestamp(p.gotoMarketGoal);
      const hasGtmSoon = gtmGoal && gtmGoal > now && gtmGoal <= now + 90 * DAY_MS;
      const hasSeriousBuyers = seriousBuyers.length > 0;
      const hasOpinions = opinions.length > 0;
      const isOnPremarket = p.active !== false;

      // "Upcoming" = on premarket AND has any signal
      if (!isOnPremarket) continue;

      // Likelihood score: higher = more likely to transact
      let likelihood = 0;
      if (hasGtmSoon) likelihood += 40;
      if (hasSeriousBuyers) likelihood += 30 + Math.min(seriousBuyers.length * 5, 20);
      if (hasOpinions) likelihood += 10 + Math.min(opinions.length * 2, 10);
      if (p.visibility) likelihood += 10;
      if ((p.isEager || 0) >= 70) likelihood += 10;
      if (p.stats?.views > 10) likelihood += 5;

      if (likelihood === 0) continue;

      upcoming.push({
        propertyId: p.id,
        address: p.formattedAddress || p.address || '',
        suburb: p._suburb || '',
        state: p._state || '',
        price: p.price || null,
        likelihood: Math.min(likelihood, 100),
        signals: {
          goingToMarketSoon: hasGtmSoon,
          goingToMarketDate: gtmGoal ? new Date(gtmGoal).toISOString().split('T')[0] : null,
          seriousBuyers: seriousBuyers.length,
          totalOpinions: opinions.length,
          isPublic: p.visibility === true,
          isEager: (p.isEager || 0) >= 70,
          views: p.stats?.views || 0,
        },
      });
    }

    // Sort by likelihood desc
    upcoming.sort((a, b) => b.likelihood - a.likelihood);

    // Group by state → suburb
    const byState = {};
    for (const p of upcoming) {
      const st = p.state || 'Unknown';
      if (!byState[st]) byState[st] = { state: st, suburbs: {}, count: 0, avgLikelihood: 0 };
      byState[st].count++;
      byState[st].avgLikelihood += p.likelihood;

      const sub = p.suburb || 'Unknown';
      if (!byState[st].suburbs[sub]) byState[st].suburbs[sub] = { suburb: sub, properties: [] };
      byState[st].suburbs[sub].properties.push(p);
    }

    // Finalize state averages and convert suburbs to arrays
    const states = Object.values(byState)
      .map((s) => ({
        state: s.state,
        count: s.count,
        avgLikelihood: Math.round(s.avgLikelihood / (s.count || 1)),
        suburbs: Object.values(s.suburbs)
          .map((sub) => ({
            suburb: sub.suburb,
            count: sub.properties.length,
            avgLikelihood: Math.round(sub.properties.reduce((sum, p) => sum + p.likelihood, 0) / sub.properties.length),
            properties: sub.properties.slice(0, 5),
          }))
          .sort((a, b) => b.avgLikelihood - a.avgLikelihood),
      }))
      .sort((a, b) => b.avgLikelihood - a.avgLikelihood);

    return NextResponse.json({
      totalUpcoming: upcoming.length,
      states,
      topProperties: upcoming.slice(0, 20),
    });
  } catch (err) {
    console.error('Upcoming to market error:', err);
    return NextResponse.json({ error: 'Failed to compute upcoming listings' }, { status: 500 });
  }
}
