import { NextResponse } from 'next/server';
import { validateApiKey } from '../middleware';
import {
  parseLocationParams,
  getPropertiesInRadius,
  getOffersForProperties,
  getLikesForProperties,
  calculateBuyerScore,
  calculateSellerScore,
} from '../helpers';
import { getHistoricalTrends } from '../scoreComputation';

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

    const { searchParams } = new URL(request.url);
    const months = Math.min(parseInt(searchParams.get('months')) || 6, 12);

    const { lat, lng, radius, resolvedPlace, suburb, state } = location;

    // Try cached trends first
    if (suburb && state) {
      const cachedTrends = await getHistoricalTrends(suburb, state, months);
      if (cachedTrends.length > 0) {
        return NextResponse.json({
          location: { lat, lng, radius, ...(resolvedPlace && { resolvedPlace }) },
          months,
          trends: cachedTrends.map((t) => ({
            monthKey: t.monthKey,
            buyerScore: t.buyerScore,
            sellerScore: t.sellerScore,
            propertyCount: t.propertyCount,
          })),
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

    const now = new Date();
    const trends = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const startMs = monthStart.getTime();
      const endMs = monthEnd.getTime();

      const monthOffers = offers.filter((o) => {
        const ts = toTimestamp(o.createdAt || o.updatedAt);
        return ts && ts >= startMs && ts <= endMs;
      });

      const monthLikes = likes.filter((l) => {
        const ts = toTimestamp(l.createdAt);
        return ts && ts >= startMs && ts <= endMs;
      });

      const monthProperties = properties.filter((p) => {
        const ts = toTimestamp(p.createdAt || p.created);
        return !ts || ts <= endMs;
      });

      const buyerResult = calculateBuyerScore(monthProperties, monthOffers, monthLikes);
      const sellerResult = calculateSellerScore(monthProperties);

      trends.push({
        month: monthStart.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
        monthKey: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        buyerScore: buyerResult.score,
        sellerScore: sellerResult.score,
        opinions: monthOffers.filter((o) => o.type === 'opinion').length,
        likes: monthLikes.length,
        activeProperties: monthProperties.filter((p) => p.visibility === true).length,
      });
    }

    return NextResponse.json({
      location: { lat, lng, radius, ...(resolvedPlace && { resolvedPlace }) },
      months,
      propertiesAnalyzed: properties.length,
      trends,
    });
  } catch (err) {
    console.error('Historical trends error:', err);
    return NextResponse.json({ error: 'Failed to generate historical trends' }, { status: 500 });
  }
}

function toTimestamp(val) {
  if (!val) return null;
  if (val.toMillis) return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}
