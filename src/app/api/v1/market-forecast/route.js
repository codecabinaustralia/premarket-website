import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import {
  parseLocationParams,
  getPropertiesInRadius,
  getOffersForProperties,
  getLikesForProperties,
  median,
  formatPrice,
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

    // Try cached forecast first
    if (suburb && state) {
      const cached = await getCachedScore(suburb, state);
      if (cached && !cached.stale && cached.forecastNext30) {
        const { count, medianPrice, demandRatio } = cached.forecastNext30;
        return NextResponse.json({
          location: { lat, lng, radius, ...(resolvedPlace && { resolvedPlace }) },
          propertiesAnalyzed: cached.propertyCount,
          forecast: {
            goingToMarketNext30Days: count,
            expectedMedianPrice: medianPrice || null,
            expectedMedianPriceFormatted: formatPrice(medianPrice),
            demandRatio,
            demandIndicator:
              demandRatio === null
                ? 'insufficient_data'
                : demandRatio >= 1.05
                  ? 'high'
                  : demandRatio >= 0.95
                    ? 'balanced'
                    : 'low',
          },
          confidence: cached.confidence || null,
          cached: true,
        });
      }
    }

    // Fallback to real-time computation
    const properties = await getPropertiesInRadius(lat, lng, radius);

    const now = Date.now();
    const DAY_MS = 86400000;

    const goingToMarket = properties.filter((p) => {
      const goal = toTimestamp(p.gotoMarketGoal);
      return goal && goal > now && goal <= now + 30 * DAY_MS;
    });

    const prices = goingToMarket
      .map((p) => parseFloat(String(p.price).replace(/[^0-9.]/g, '')))
      .filter((n) => !isNaN(n) && n > 0);
    const medianPrice = median(prices);

    const propertyIds = properties.map((p) => p.id);
    const [offers, likes] = await Promise.all([
      getOffersForProperties(propertyIds),
      getLikesForProperties(propertyIds),
    ]);
    const opinions = offers.filter((o) => o.type === 'opinion');

    let demandRatio = null;
    if (opinions.length > 0 && prices.length > 0) {
      const offerAmounts = opinions
        .map((o) => parseFloat(o.offerAmount) || 0)
        .filter((a) => a > 0);
      if (offerAmounts.length > 0) {
        const medianOffer = median(offerAmounts);
        const medianListingPrice = median(
          properties
            .map((p) => parseFloat(String(p.price).replace(/[^0-9.]/g, '')))
            .filter((n) => !isNaN(n) && n > 0)
        );
        if (medianListingPrice > 0) {
          demandRatio = Math.round((medianOffer / medianListingPrice) * 100) / 100;
        }
      }
    }

    const confidence = computeConfidence(properties, offers, likes);

    return NextResponse.json({
      location: { lat, lng, radius, ...(resolvedPlace && { resolvedPlace }) },
      propertiesAnalyzed: properties.length,
      forecast: {
        goingToMarketNext30Days: goingToMarket.length,
        expectedMedianPrice: medianPrice || null,
        expectedMedianPriceFormatted: formatPrice(medianPrice),
        demandRatio,
        demandIndicator:
          demandRatio === null
            ? 'insufficient_data'
            : demandRatio >= 1.05
              ? 'high'
              : demandRatio >= 0.95
                ? 'balanced'
                : 'low',
      },
      confidence,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'market-forecast' } });
    console.error('Market forecast error:', err);
    return NextResponse.json({ error: 'Failed to generate market forecast' }, { status: 500 });
  }
}

function toTimestamp(val) {
  if (!val) return null;
  if (val.toMillis) return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}
