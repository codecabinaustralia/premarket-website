import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import { adminDb } from '../../../firebase/adminApp';
import {
  parseLocationParams,
  getPropertiesInRadius,
  getOffersForProperties,
  getLikesForProperties,
  getEngagementForProperties,
} from '../helpers';
import { computeAllPHI, getWeights, computeConfidence } from '../phiScoring';
import { getCachedScore, suburbKey } from '../scoreComputation';

/**
 * GET /api/v1/phi-scores
 *
 * Returns all 8 PHI scores for a location.
 * Tries cache first (marketScores.phi), falls back to real-time computation.
 *
 * Query params: location | suburb+state | lat+lng | postcode
 */
export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const params = await parseLocationParams(request);
    if (params.error) {
      return NextResponse.json({ error: params.error }, { status: 400 });
    }

    const { lat, lng, radius, suburb, state, resolvedPlace } = params;

    // Try cache first
    if (suburb && state) {
      const cached = await getCachedScore(suburb, state);
      if (cached?.phi && !cached.stale) {
        return NextResponse.json({
          location: resolvedPlace || `${suburb}, ${state}`,
          source: 'cache',
          phi: cached.phi,
          phiBreakdown: cached.phiBreakdown || {},
          confidence: cached.confidence || null,
          computedAt: cached.computedAt,
        });
      }
    }

    // Real-time computation
    const properties = await getPropertiesInRadius(lat, lng, radius);
    if (!properties.length) {
      return NextResponse.json({
        location: resolvedPlace || `${lat}, ${lng}`,
        source: 'realtime',
        phi: { bdi: 0, smi: 0, pvi: 0, mhi: 0, evs: 0, bqi: 0, fpi: 0, sdb: 50 },
        phiBreakdown: {},
        confidence: { level: 'low', score: 0, factors: { propertyCount: 0, opinionCount: 0, seriousBuyerCount: 0, avgOpinionsPerProperty: 0, recentOpinionPercent: 0 }, warnings: ['No properties found in this area.'] },
        propertyCount: 0,
      });
    }

    const propertyIds = properties.map((p) => p.id);
    const [offers, likes, engagement] = await Promise.all([
      getOffersForProperties(propertyIds),
      getLikesForProperties(propertyIds),
      getEngagementForProperties(propertyIds),
    ]);

    const weights = await getWeights(adminDb);
    const { phi, phiBreakdown } = computeAllPHI(properties, offers, likes, engagement, weights);
    const confidence = computeConfidence(properties, offers, likes);

    return NextResponse.json({
      location: resolvedPlace || `${suburb || lat}, ${state || lng}`,
      source: 'realtime',
      phi,
      phiBreakdown,
      confidence,
      propertyCount: properties.length,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'phi-scores' } });
    console.error('PHI scores error:', err);
    return NextResponse.json({ error: 'Failed to compute PHI scores' }, { status: 500 });
  }
}
