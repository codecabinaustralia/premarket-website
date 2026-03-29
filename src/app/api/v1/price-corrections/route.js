import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import { adminDb } from '../../../firebase/adminApp';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const stateFilter = searchParams.get('state')?.toUpperCase();
    const limit = Math.min(parseInt(searchParams.get('limit')) || 30, 100);
    const threshold = parseFloat(searchParams.get('threshold')) || -10;

    // Read all pre-computed property scores
    const scoresSnap = await adminDb.collection('propertyScores').get();
    const overvalued = scoresSnap.docs
      .map((doc) => ({ propertyId: doc.id, ...doc.data() }))
      .filter((s) => {
        if (s.pvi?.status !== 'overvalued') return false;
        if (s.pvi?.deviationPercent > threshold) return false;
        if (s.pvi?.confidenceLevel === 'low') return false;
        return true;
      })
      .sort((a, b) => a.pvi.deviationPercent - b.pvi.deviationPercent);

    if (!overvalued.length) {
      return NextResponse.json({
        totalOvervalued: 0,
        threshold,
        generatedAt: new Date().toISOString(),
        properties: [],
      });
    }

    // Batch-load property details
    const topN = overvalued.slice(0, limit + 20); // fetch extra to account for state filtering
    const refs = topN.map((s) => adminDb.collection('properties').doc(s.propertyId));
    const propDocs = await adminDb.getAll(...refs);

    const properties = [];
    for (let i = 0; i < topN.length && properties.length < limit; i++) {
      const score = topN[i];
      if (!propDocs[i].exists) continue;
      const p = propDocs[i].data();
      const state = (p.state || p.location?.state || '').toUpperCase();
      if (stateFilter && state !== stateFilter) continue;

      properties.push({
        propertyId: score.propertyId,
        address: p.formattedAddress || p.address || 'Unknown',
        suburb: p.suburb || p.location?.suburb || '',
        state,
        listingPrice: parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || null,
        medianBuyerOpinion: score.pvi.medianOpinion,
        deviationPercent: score.pvi.deviationPercent,
        opinionToListingRatio: score.pvi.opinionToListingRatio,
        confidenceLevel: score.pvi.confidenceLevel,
        totalOpinions: score.engagement?.totalOpinions || 0,
        seriousBuyers: score.engagement?.seriousBuyerCount || 0,
        opinionsPerDay: score.engagement?.opinionsPerDay || 0,
        priceDropLikelihood: computePriceDropLikelihood(score),
        signals: computePriceDropSignals(score),
      });
    }

    return NextResponse.json({
      totalOvervalued: overvalued.length,
      showing: properties.length,
      threshold,
      generatedAt: new Date().toISOString(),
      properties,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'price-corrections' } });
    console.error('Price corrections error:', err);
    return NextResponse.json({ error: 'Failed to generate price corrections' }, { status: 500 });
  }
}

function computePriceDropLikelihood(score) {
  const dev = Math.abs(score.pvi?.deviationPercent || 0);
  let likelihood = 0;

  if (dev > 20) likelihood += 40;
  else if (dev > 15) likelihood += 30;
  else if (dev > 10) likelihood += 20;

  if (score.pvi?.confidenceLevel === 'high') likelihood += 30;
  else if (score.pvi?.confidenceLevel === 'medium') likelihood += 15;

  if (score.engagement?.opinionsPerDay < 0.1 && score.engagement?.totalOpinions > 0) likelihood += 15;
  if (score.engagement?.seriousBuyerCount >= 3) likelihood += 15;

  return Math.min(likelihood, 100);
}

function computePriceDropSignals(score) {
  const signals = [];
  const dev = score.pvi?.deviationPercent || 0;

  if (dev < -20) signals.push('Severe overpricing — buyers value 20%+ below asking');
  else if (dev < -15) signals.push('Significant overpricing — buyers value 15%+ below asking');
  else if (dev < -10) signals.push('Moderate overpricing — buyers value 10%+ below asking');

  if (score.engagement?.seriousBuyerCount >= 3 && dev < -10) {
    signals.push('Serious buyers present but unwilling to meet asking price');
  }

  if (score.engagement?.opinionsPerDay < 0.1 && score.engagement?.totalOpinions >= 3) {
    signals.push('Engagement has stalled — property losing momentum');
  }

  if (score.pvi?.confidenceLevel === 'high') {
    signals.push('High confidence — 6+ buyer opinions support this assessment');
  }

  return signals;
}
