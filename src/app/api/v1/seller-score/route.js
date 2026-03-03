import { NextResponse } from 'next/server';
import { validateApiKey } from '../middleware';
import {
  parseLocationParams,
  getPropertiesInRadius,
  calculateSellerScore,
} from '../helpers';
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
          score: cached.sellerScore,
          location: { lat, lng, radius, ...(resolvedPlace && { resolvedPlace }) },
          propertiesAnalyzed: cached.propertyCount,
          breakdown: cached.sellerScoreBreakdown,
          cached: true,
        });
      }
    }

    // Fallback to real-time computation
    const properties = await getPropertiesInRadius(lat, lng, radius);
    const result = calculateSellerScore(properties);

    return NextResponse.json({
      score: result.score,
      location: { lat, lng, radius, ...(resolvedPlace && { resolvedPlace }) },
      propertiesAnalyzed: properties.length,
      breakdown: result.breakdown,
    });
  } catch (err) {
    console.error('Seller score error:', err);
    return NextResponse.json({ error: 'Failed to calculate seller score' }, { status: 500 });
  }
}
