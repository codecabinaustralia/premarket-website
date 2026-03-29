import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import {
  parseLocationParams,
  getPropertiesInRadius,
  getOffersForProperties,
  getLikesForProperties,
  getEngagementForProperties,
} from '../helpers';
import { computeAllPHI, getWeights, computeConfidence } from '../phiScoring';
import { getCachedScore, getHistoricalTrends } from '../scoreComputation';
import { adminDb } from '../../../firebase/adminApp';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const loc = await parseLocationParams(request);
    if (loc.error) {
      return NextResponse.json({ error: loc.error }, { status: 400 });
    }

    const { lat, lng, radius, resolvedPlace, suburb, state } = loc;

    // Try cached scores first
    let phi, sellerScore, buyerScore, propertyCount, confidence, forecastNext30;
    let trends = [];

    if (suburb && state) {
      const [cached, historicalTrends] = await Promise.all([
        getCachedScore(suburb, state),
        getHistoricalTrends(suburb, state, 3),
      ]);
      trends = historicalTrends || [];

      if (cached && !cached.stale && cached.phi) {
        phi = cached.phi;
        sellerScore = cached.sellerScore;
        buyerScore = cached.buyerScore;
        propertyCount = cached.propertyCount;
        confidence = cached.confidence;
        forecastNext30 = cached.forecastNext30;
      }
    }

    // Fall back to real-time computation
    if (!phi) {
      const properties = await getPropertiesInRadius(lat, lng, radius);
      if (!properties.length) {
        return NextResponse.json({
          error: 'No properties found in this area',
          resolvedPlace,
        }, { status: 404 });
      }
      const propertyIds = properties.map((p) => p.id);
      const [offers, likes, engagement] = await Promise.all([
        getOffersForProperties(propertyIds),
        getLikesForProperties(propertyIds),
        getEngagementForProperties(propertyIds),
      ]);

      const weights = await getWeights(adminDb);
      const phiResult = computeAllPHI(properties, offers, likes, engagement, weights);
      phi = phiResult.phi;
      propertyCount = properties.length;
      confidence = computeConfidence(properties, offers, likes);
    }

    const timing = assessSellerTiming(phi, trends, forecastNext30);

    return NextResponse.json({
      resolvedPlace,
      recommendation: timing.recommendation,
      timingScore: timing.score,
      timing: timing.timing,
      summary: timing.summary,
      signals: timing.signals,
      risks: timing.risks,
      metrics: {
        buyerDemand: phi.bdi,
        sellerMotivation: phi.smi,
        supplyDemandBalance: phi.sdb,
        engagementVelocity: phi.evs,
        forwardPipeline: phi.fpi,
        pricingValidity: phi.pvi,
        buyerQuality: phi.bqi,
        marketHeat: phi.mhi,
      },
      trendDirection: getTrendDirection(trends),
      propertyCount,
      confidence,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'seller-timing' } });
    console.error('Seller timing error:', err);
    return NextResponse.json({ error: 'Failed to generate seller timing report' }, { status: 500 });
  }
}

function getTrendDirection(trends) {
  if (trends.length < 2) return null;
  const recent = trends[trends.length - 1];
  const prior = trends[trends.length - 2];
  return {
    buyerScoreDelta: (recent.buyerScore || 0) - (prior.buyerScore || 0),
    sellerScoreDelta: (recent.sellerScore || 0) - (prior.sellerScore || 0),
    months: trends.map((t) => ({
      month: t.monthKey,
      buyerScore: t.buyerScore,
      sellerScore: t.sellerScore,
    })),
  };
}

function assessSellerTiming(phi, trends, forecast) {
  const bdi = phi.bdi || 0;
  const smi = phi.smi || 0;
  const sdb = phi.sdb || 50;
  const evs = phi.evs || 0;
  const fpi = phi.fpi || 0;
  const pvi = phi.pvi || 50;
  const bqi = phi.bqi || 0;
  const mhi = phi.mhi || 0;

  // Higher = better time to sell
  let score = 0;
  const signals = [];
  const risks = [];

  // Strong buyer demand = good time to sell
  if (bdi >= 60) {
    score += 25;
    signals.push('Strong buyer demand in your area');
  } else if (bdi >= 40) {
    score += 15;
    signals.push('Moderate buyer demand — sufficient interest');
  } else {
    score += 5;
    risks.push('Low buyer demand — may take longer to find the right buyer');
  }

  // Seller's market = good time to sell
  if (sdb > 60) {
    score += 20;
    signals.push("Seller's market — demand exceeds supply");
  } else if (sdb > 50) {
    score += 10;
    signals.push('Slightly favoring sellers — balanced to positive conditions');
  } else {
    score += 0;
    risks.push("Buyer's market — buyers have more negotiating power");
  }

  // Fast engagement = properties getting attention
  if (evs > 50) {
    score += 15;
    signals.push('Properties attracting interest quickly in this area');
  } else if (evs < 25) {
    risks.push('Slow engagement — new listings take time to attract attention');
  }

  // Low pipeline = less competition from other sellers
  if (fpi < 30) {
    score += 15;
    signals.push('Low upcoming supply — less competition from other sellers');
  } else if (fpi > 60) {
    risks.push(`${fpi > 70 ? 'Heavy' : 'Growing'} supply pipeline — more properties entering the market soon`);
  }

  // Good pricing = smoother transaction
  if (pvi > 70) {
    score += 10;
    signals.push('Area is well-priced — buyers and sellers largely agree on values');
  } else if (pvi < 50) {
    risks.push('Pricing misalignment in this area — ensure competitive pricing');
  }

  // Quality buyers = more likely to transact
  if (bqi > 50) {
    score += 10;
    signals.push('Quality buyer pool — financially ready buyers present');
  }

  // Trend momentum
  if (trends.length >= 2) {
    const recent = trends[trends.length - 1];
    const prior = trends[trends.length - 2];
    const bdiDelta = (recent.buyerScore || 0) - (prior.buyerScore || 0);
    if (bdiDelta > 5) {
      score += 5;
      signals.push('Buyer demand is trending upward');
    } else if (bdiDelta < -5) {
      risks.push('Buyer demand has been declining — consider acting sooner');
    }
  }

  score = Math.min(score, 100);

  let timing, recommendation;
  if (score >= 70) {
    timing = 'list_now';
    recommendation = 'Strong market conditions — this is a good time to list. Buyer demand is healthy, competition from other sellers is manageable, and engagement is positive. Price competitively to capitalize on current momentum.';
  } else if (score >= 50) {
    timing = 'favorable';
    recommendation = 'Favorable conditions for selling. Market fundamentals are solid. Consider listing within the next 2-4 weeks to take advantage of current demand levels before the pipeline of competing properties grows.';
  } else if (score >= 30) {
    timing = 'neutral';
    recommendation = 'Neutral market conditions. You can list, but be prepared for longer time on market. Price competitively and invest in quality presentation to stand out in a balanced market.';
  } else {
    timing = 'wait';
    recommendation = "Current conditions favor buyers. Unless you need to sell urgently, consider waiting for demand to strengthen. If you must list now, price aggressively — overpricing in this market will lead to extended days on market.";
  }

  const summary = `Timing score: ${score}/100 (${timing.replace('_', ' ')}). ${signals.length} positive signal${signals.length !== 1 ? 's' : ''}, ${risks.length} risk${risks.length !== 1 ? 's' : ''}.`;

  return { score, timing, recommendation, summary, signals, risks };
}
