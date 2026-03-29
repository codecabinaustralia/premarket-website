import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import { adminDb } from '../../../firebase/adminApp';
import {
  parseLocationParams,
  getPropertiesInRadius,
  getOffersForProperties,
  getLikesForProperties,
  median,
  formatPrice,
} from '../helpers';
import { calculatePVI, getWeights, computeConfidence } from '../phiScoring';

/**
 * GET /api/v1/property-valuation
 *
 * Per-property valuation analysis: overvalued/undervalued list sorted by deviation.
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

    const { lat, lng, radius, resolvedPlace, suburb, state } = params;

    const properties = await getPropertiesInRadius(lat, lng, radius);
    if (!properties.length) {
      return NextResponse.json({
        location: resolvedPlace || `${lat}, ${lng}`,
        totalProperties: 0,
        analyzed: 0,
        properties: [],
      });
    }

    const propertyIds = properties.map((p) => p.id);
    const [offers, likes] = await Promise.all([
      getOffersForProperties(propertyIds),
      getLikesForProperties(propertyIds),
    ]);

    const weights = await getWeights(adminDb);
    const { score, breakdown, propertyPVI } = calculatePVI(properties, offers, weights.pvi);

    // Enrich with property details
    const propsById = {};
    for (const p of properties) propsById[p.id] = p;

    const enriched = propertyPVI.map((pv) => {
      const p = propsById[pv.propertyId];
      return {
        ...pv,
        address: p?.formattedAddress || p?.address || '',
        listingPriceFormatted: formatPrice(pv.listingPrice),
        medianOpinionFormatted: formatPrice(pv.medianOpinion),
      };
    });

    // Sort by absolute deviation descending (most mispriced first)
    enriched.sort((a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent));

    const confidence = computeConfidence(properties, offers, likes);

    return NextResponse.json({
      location: resolvedPlace || `${suburb || lat}, ${state || lng}`,
      totalProperties: properties.length,
      analyzed: breakdown.totalAnalyzed,
      pviScore: score,
      summary: {
        fairlyPriced: breakdown.fairlyPriced,
        overvalued: breakdown.overvalued,
        undervalued: breakdown.undervalued,
        avgDeviationPercent: breakdown.avgDeviationPercent,
      },
      confidence,
      properties: enriched,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'property-valuation' } });
    console.error('Property valuation error:', err);
    return NextResponse.json({ error: 'Failed to compute valuations' }, { status: 500 });
  }
}
