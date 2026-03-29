import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import {
  parseLocationParams,
  getPropertiesInRadius,
  getOffersForProperties,
  getLikesForProperties,
  calculateBuyerScore,
} from '../helpers';
import { computeConfidence } from '../phiScoring';
import { getCachedScore } from '../scoreComputation';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const location = await parseLocationParams(request);
    if (location.error) {
      return NextResponse.json({ error: location.error }, { status: 400 });
    }

    const { lat, lng, radius, resolvedPlace, suburb, state } = location;

    // Try cached score first
    if (suburb && state) {
      const cached = await getCachedScore(suburb, state);
      if (cached && !cached.stale) {
        return NextResponse.json({
          score: cached.buyerScore,
          location: { lat, lng, radius, ...(resolvedPlace && { resolvedPlace }) },
          propertiesAnalyzed: cached.propertyCount,
          breakdown: cached.buyerScoreBreakdown,
          confidence: cached.confidence || null,
          cached: true,
        });
      }
    }

    // Fallback to real-time computation
    const properties = await getPropertiesInRadius(lat, lng, radius);
    const propertyIds = properties.map((p) => p.id);

    const [offers, likes] = await Promise.all([
      getOffersForProperties(propertyIds),
      getLikesForProperties(propertyIds),
    ]);

    const result = calculateBuyerScore(properties, offers, likes);
    const confidence = computeConfidence(properties, offers, likes);

    return NextResponse.json({
      score: result.score,
      location: { lat, lng, radius, ...(resolvedPlace && { resolvedPlace }) },
      propertiesAnalyzed: properties.length,
      breakdown: result.breakdown,
      confidence,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'buyer-score' } });
    console.error('Buyer score error:', err);
    return NextResponse.json({ error: 'Failed to calculate buyer score' }, { status: 500 });
  }
}
