import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import { getAllCachedScores } from '../scoreComputation';

/**
 * GET /api/v1/heatmap-data
 *
 * Returns GeoJSON FeatureCollection from marketScores for Mapbox visualization.
 * Query param `metric` selects which PHI score to use for color intensity.
 *
 * Valid metrics: bdi, smi, pvi, mhi, evs, bqi, fpi, sdb, buyerScore, sellerScore
 */
export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'mhi';
    const validMetrics = ['bdi', 'smi', 'pvi', 'mhi', 'evs', 'bqi', 'fpi', 'sdb', 'buyerScore', 'sellerScore'];
    if (!validMetrics.includes(metric)) {
      return NextResponse.json({ error: `Invalid metric. Valid: ${validMetrics.join(', ')}` }, { status: 400 });
    }

    const scores = await getAllCachedScores();

    const features = scores
      .filter((s) => s.lat && s.lng)
      .map((s) => {
        // Get the score value - PHI metrics are nested under phi object
        let value;
        if (['bdi', 'smi', 'pvi', 'mhi', 'evs', 'bqi', 'fpi', 'sdb'].includes(metric)) {
          value = s.phi?.[metric] ?? 0;
        } else {
          value = s[metric] ?? 0;
        }

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [s.lng, s.lat],
          },
          properties: {
            key: s.key,
            suburb: s.suburb,
            state: s.state,
            postcode: s.postcode,
            value,
            metric,
            propertyCount: s.propertyCount || 0,
            buyerScore: s.buyerScore || 0,
            sellerScore: s.sellerScore || 0,
            phi: s.phi || {},
            confidenceLevel: s.confidence?.level || null,
            confidenceScore: s.confidence?.score || null,
          },
        };
      });

    return NextResponse.json({
      type: 'FeatureCollection',
      features,
      metadata: {
        metric,
        totalSuburbs: features.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'heatmap-data' } });
    console.error('Heatmap data error:', err);
    return NextResponse.json({ error: 'Failed to generate heatmap data' }, { status: 500 });
  }
}
