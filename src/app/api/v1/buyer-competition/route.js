import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import {
  parseLocationParams,
  getPropertiesInRadius,
  getOffersForProperties,
  getLikesForProperties,
  getEngagementForProperties,
  calculateBuyerScore,
} from '../helpers';
import { computeAllPHI, getWeights, computeConfidence } from '../phiScoring';
import { getCachedScore } from '../scoreComputation';
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
    let phi, buyerScore, buyerBreakdown, propertyCount, confidence, forecastNext30;

    if (suburb && state) {
      const cached = await getCachedScore(suburb, state);
      if (cached && !cached.stale && cached.phi) {
        phi = cached.phi;
        buyerScore = cached.buyerScore;
        buyerBreakdown = cached.buyerScoreBreakdown;
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
      const buyerResult = calculateBuyerScore(properties, offers, likes);
      buyerScore = buyerResult.score;
      buyerBreakdown = buyerResult.breakdown;
      propertyCount = properties.length;
      confidence = computeConfidence(properties, offers, likes);
    }

    const competition = assessCompetition(phi, buyerScore, forecastNext30);

    return NextResponse.json({
      resolvedPlace,
      competitionScore: competition.score,
      competitionLevel: competition.level,
      summary: competition.summary,
      signals: competition.signals,
      recommendation: competition.recommendation,
      metrics: {
        buyerDemand: phi.bdi,
        buyerQuality: phi.bqi,
        supplyDemandBalance: phi.sdb,
        engagementVelocity: phi.evs,
        marketHeat: phi.mhi,
        pricingValidity: phi.pvi,
      },
      buyerScore,
      buyerBreakdown,
      propertyCount,
      confidence,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'buyer-competition' } });
    console.error('Buyer competition error:', err);
    return NextResponse.json({ error: 'Failed to generate buyer competition report' }, { status: 500 });
  }
}

function assessCompetition(phi, buyerScore, forecast) {
  const bdi = phi.bdi || 0;
  const bqi = phi.bqi || 0;
  const sdb = phi.sdb || 50;
  const evs = phi.evs || 0;

  // Competition = high demand + quality buyers + seller's market + fast engagement
  const sellerPressure = Math.max(0, sdb - 50) * 2; // 0-100 scale from SDB above 50
  const score = Math.min(
    Math.round(bdi * 0.35 + bqi * 0.25 + sellerPressure * 0.25 + evs * 0.15),
    100
  );

  let level, summary;
  if (score >= 75) {
    level = 'extreme';
    summary = 'Extremely competitive — expect multiple offers and properties selling above asking price.';
  } else if (score >= 55) {
    level = 'high';
    summary = 'Highly competitive — strong buyer demand with quality buyers. Be prepared to move fast.';
  } else if (score >= 35) {
    level = 'moderate';
    summary = 'Moderately competitive — healthy market with balanced buyer/seller dynamics.';
  } else if (score >= 15) {
    level = 'low';
    summary = 'Low competition — buyers have negotiating power. Good conditions for purchasing.';
  } else {
    level = 'very_low';
    summary = "Very low competition — buyer's market. Significant room for negotiation.";
  }

  const signals = [];
  if (bdi >= 70) signals.push('Strong buyer demand — many active buyers competing');
  else if (bdi < 30) signals.push('Weak buyer demand — few active buyers in area');

  if (bqi >= 60) signals.push('High-quality buyer pool — financially ready investors and upgraders');
  else if (bqi < 30) signals.push('Casual buyer pool — mostly browsers and early-stage interest');

  if (sdb > 60) signals.push("Seller's market — demand outstrips available supply");
  else if (sdb < 40) signals.push("Buyer's market — more supply than demand, negotiating power");

  if (evs > 60) signals.push('Properties attracting interest quickly — fast-moving market');
  else if (evs < 30) signals.push('Slow engagement — properties taking time to attract interest');

  const demandRatio = forecast?.demandRatio;
  if (demandRatio > 1.05) signals.push(`Buyers willing to pay above asking (demand ratio: ${demandRatio})`);
  else if (demandRatio && demandRatio < 0.95) signals.push(`Buyers offering below asking (demand ratio: ${demandRatio}) — room for negotiation`);

  let recommendation;
  if (score >= 55) {
    recommendation = 'Get pre-approved and be ready to act fast. Properties attract strong interest. Consider expanding your search radius to find less competitive pockets nearby.';
  } else if (score >= 35) {
    recommendation = "Normal conditions — you have time to evaluate but don't delay on properties you like. Look for listings that have been on market longer for better negotiating leverage.";
  } else {
    recommendation = 'Buyer-friendly conditions. Take your time, negotiate confidently, and look for overvalued properties where motivated sellers may accept lower offers.';
  }

  return { score, level, summary, signals, recommendation };
}
