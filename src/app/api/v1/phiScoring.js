import { isEagerSeller, getEagernessWeight, median } from './helpers';

/**
 * PHI - Premarket Health Indicators
 *
 * 8 core metrics that provide forward-looking market intelligence:
 * BDI, SMI, PVI, MHI, EVS, BQI, FPI, SDB
 *
 * Each function returns { score: 0-100, breakdown: {} }
 */

// ─── Shared Normalization Constants ─────────────────────────────────────────
export const NORMALIZATION = {
  MAX_OPINIONS: 50,
  MAX_SERIOUS: 20,
  MAX_LIKES: 100,
  MAX_SERIOUSNESS: 200,
  MAX_ACTIVE: 30,
  MAX_GTM: 15,
  MAX_EAGER: 10,
};

// ─── Property Lifecycle Helpers ─────────────────────────────────────────────

function toTimestamp(val) {
  if (!val) return null;
  if (val.toMillis) return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Segment properties into lifecycle states.
 */
export function segmentProperties(properties) {
  const onMarket = [];
  const premarket = [];
  const offMarket = [];

  for (const p of properties) {
    if (p.listingStatus === 'on-market') {
      onMarket.push(p);
    } else if (p.visibility === true && p.active !== false) {
      premarket.push(p);
    } else {
      offMarket.push(p);
    }
  }

  return { onMarket, premarket, offMarket };
}

// ─── Configurable Weights (defaults, overridden by Firestore phiWeights) ────

const DEFAULT_WEIGHTS = {
  bdi: { opinions: 0.20, serious: 0.30, likes: 0.15, seriousness: 0.20, diversity: 0.10, velocity: 0.05 },
  smi: { active: 0.20, gtm30: 0.25, gtm60: 0.10, eagerness: 0.25, density: 0.10, listingStatus: 0.10 },
  pvi: { deviationThreshold: 0.07 },
  mhi: { bdi: 0.35, smi: 0.25, evs: 0.25, pvi: 0.15 },
  evs: { timeToFirst: 0.40, opinionsPerDay: 0.35, engagementDepth: 0.25 },
  bqi: { seriousness: 0.50, buyerType: 0.30, financialReady: 0.20 },
  fpi: { gtm30: 0.35, gtm60: 0.20, gtm90: 0.10, eager: 0.20, growth: 0.15 },
  sdb: { supplyWeight: 0.50, demandWeight: 0.50 },
};

let _cachedWeights = null;
let _weightsCacheTime = 0;
const WEIGHTS_CACHE_TTL = 3600000; // 1 hour

/**
 * Get scoring weights from Firestore cache or defaults.
 */
export async function getWeights(adminDb) {
  if (_cachedWeights && Date.now() - _weightsCacheTime < WEIGHTS_CACHE_TTL) {
    return _cachedWeights;
  }
  try {
    if (adminDb) {
      const doc = await adminDb.collection('settings').doc('phiWeights').get();
      if (doc.exists) {
        _cachedWeights = { ...DEFAULT_WEIGHTS, ...doc.data() };
        _weightsCacheTime = Date.now();
        return _cachedWeights;
      }
    }
  } catch (e) {
    // Fall through to defaults
  }
  _cachedWeights = DEFAULT_WEIGHTS;
  _weightsCacheTime = Date.now();
  return _cachedWeights;
}

/**
 * Clear the weights cache (called during cron refresh).
 */
export function clearWeightsCache() {
  _cachedWeights = null;
  _weightsCacheTime = 0;
}

// ─── BDI: Buyer Demand Index ────────────────────────────────────────────────

/**
 * Real buyer demand from opinions, serious registrations, likes, engagement.
 */
export function calculateBDI(properties, offers, likes, weights = DEFAULT_WEIGHTS.bdi) {
  if (!properties.length) return { score: 0, breakdown: {} };

  const opinions = offers.filter((o) => o.type === 'opinion');
  const seriousBuyers = opinions.filter((o) => o.serious === true);
  const totalOpinions = opinions.length;
  const totalSerious = seriousBuyers.length;
  const totalLikes = likes.length;

  // Seriousness level weights (Flutter app values)
  const levelWeights = { just_browsing: 1, interested: 2, very_interested: 3, ready_to_buy: 4 };
  const seriousnessScore = opinions.reduce((sum, o) => {
    const level = (o.seriousnessLevel || '').toLowerCase();
    return sum + (levelWeights[level] || 1);
  }, 0);

  // Buyer diversity
  const fhbCount = opinions.filter((o) => o.isFirstHomeBuyer).length;
  const investorCount = opinions.filter((o) => o.isInvestor).length;
  const totalTyped = fhbCount + investorCount;
  const diversityRatio = totalTyped > 0 ? 1 - Math.abs(fhbCount - investorCount) / totalTyped : 0;

  // Engagement velocity indicator (opinions per property)
  const opinionsPerProperty = properties.length > 0 ? totalOpinions / properties.length : 0;
  const velocitySignal = Math.min(opinionsPerProperty / 5, 1); // 5+ opinions/property = max

  const { MAX_OPINIONS, MAX_SERIOUS, MAX_LIKES, MAX_SERIOUSNESS } = NORMALIZATION;

  const normOpinions = Math.min(totalOpinions / MAX_OPINIONS, 1);
  const normSerious = Math.min(totalSerious / MAX_SERIOUS, 1);
  const normLikes = Math.min(totalLikes / MAX_LIKES, 1);
  const normSeriousness = Math.min(seriousnessScore / MAX_SERIOUSNESS, 1);

  const raw =
    normOpinions * weights.opinions +
    normSerious * weights.serious +
    normLikes * weights.likes +
    normSeriousness * weights.seriousness +
    diversityRatio * weights.diversity +
    velocitySignal * (weights.velocity || 0.05);

  return {
    score: Math.round(Math.min(raw, 1) * 100),
    breakdown: {
      totalOpinions,
      seriousBuyers: totalSerious,
      passiveBuyers: totalOpinions - totalSerious,
      totalLikes,
      seriousnessScore,
      diversityRatio: Math.round(diversityRatio * 100) / 100,
      fhbCount,
      investorCount,
      opinionsPerProperty: Math.round(opinionsPerProperty * 100) / 100,
    },
  };
}

// ─── SMI: Seller Motivation Index ───────────────────────────────────────────

/**
 * How eager/committed sellers are to transact.
 * Uses 3-tier eagerness weighting instead of binary.
 */
export function calculateSMI(properties, weights = DEFAULT_WEIGHTS.smi) {
  if (!properties.length) return { score: 0, breakdown: {} };

  const now = Date.now();
  const DAY_MS = 86400000;
  const { onMarket, premarket } = segmentProperties(properties);

  const activeProperties = properties.filter((p) => p.visibility === true);

  // Go-to-market timeline
  const goingToMarket30 = properties.filter((p) => {
    const goal = toTimestamp(p.gotoMarketGoal);
    return goal && goal > now && goal <= now + 30 * DAY_MS;
  });
  const goingToMarket60 = properties.filter((p) => {
    const goal = toTimestamp(p.gotoMarketGoal);
    return goal && goal > now && goal <= now + 60 * DAY_MS;
  });

  // Weighted eagerness
  const eagernessSum = properties.reduce((sum, p) => sum + getEagernessWeight(p), 0);
  const eagerCount = properties.filter((p) => isEagerSeller(p)).length;

  // Listing status signal: on-market sellers are the most committed
  const onMarketRatio = properties.length > 0 ? onMarket.length / properties.length : 0;

  const { MAX_ACTIVE, MAX_GTM, MAX_EAGER } = NORMALIZATION;

  const normActive = Math.min(activeProperties.length / MAX_ACTIVE, 1);
  const normGtm30 = Math.min(goingToMarket30.length / MAX_GTM, 1);
  const normGtm60 = Math.min(goingToMarket60.length / MAX_GTM, 1);
  const normEager = Math.min(eagernessSum / MAX_EAGER, 1);
  const normDensity = Math.min(properties.length / NORMALIZATION.MAX_OPINIONS, 1);

  const raw =
    normActive * weights.active +
    normGtm30 * weights.gtm30 +
    normGtm60 * weights.gtm60 +
    normEager * weights.eagerness +
    normDensity * weights.density +
    onMarketRatio * (weights.listingStatus || 0.10);

  return {
    score: Math.round(Math.min(raw, 1) * 100),
    breakdown: {
      activeProperties: activeProperties.length,
      totalProperties: properties.length,
      onMarketCount: onMarket.length,
      premarketCount: premarket.length,
      goingToMarket30: goingToMarket30.length,
      goingToMarket60: goingToMarket60.length,
      eagerSellers: eagerCount,
      eagernessWeightedScore: Math.round(eagernessSum * 100) / 100,
    },
  };
}

// ─── PVI: Price Validity Index ──────────────────────────────────────────────

/**
 * Whether properties are correctly priced vs buyer opinions.
 * 100 = perfectly priced area, 0 = severely mispriced.
 */
export function calculatePVI(properties, offers, weights = DEFAULT_WEIGHTS.pvi) {
  if (!properties.length) return { score: 0, breakdown: {} };

  const threshold = weights.deviationThreshold || 0.07;
  const opinions = offers.filter((o) => o.type === 'opinion');

  // Group opinions by property
  const opinionsByProperty = {};
  for (const o of opinions) {
    if (!opinionsByProperty[o.propertyId]) opinionsByProperty[o.propertyId] = [];
    opinionsByProperty[o.propertyId].push(o);
  }

  let totalAnalyzed = 0;
  let totalFairlyPriced = 0;
  let totalOvervalued = 0;
  let totalUndervalued = 0;
  let totalDeviation = 0;
  const propertyPVI = [];

  for (const p of properties) {
    const propOpinions = opinionsByProperty[p.id] || [];
    const offerAmounts = propOpinions
      .map((o) => parseFloat(o.offerAmount) || 0)
      .filter((a) => a > 0);

    if (offerAmounts.length === 0) continue;

    const listingPrice = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
    if (!listingPrice || isNaN(listingPrice)) continue;

    const medianOpinion = median(offerAmounts);
    const deviation = (medianOpinion - listingPrice) / listingPrice;
    const absDeviation = Math.abs(deviation);

    let status;
    if (absDeviation <= threshold) {
      status = 'fair';
      totalFairlyPriced++;
    } else if (deviation < 0) {
      status = 'overvalued';
      totalOvervalued++;
    } else {
      status = 'undervalued';
      totalUndervalued++;
    }

    const confidenceLevel = offerAmounts.length >= 6 ? 'high' : offerAmounts.length >= 3 ? 'medium' : 'low';

    totalAnalyzed++;
    totalDeviation += absDeviation;

    propertyPVI.push({
      propertyId: p.id,
      medianOpinion,
      listingPrice,
      deviationPercent: Math.round(deviation * 10000) / 100,
      status,
      confidenceLevel,
      opinionCount: offerAmounts.length,
    });
  }

  // Score: percentage fairly priced, penalized by average deviation
  let score = 0;
  if (totalAnalyzed > 0) {
    const fairRatio = totalFairlyPriced / totalAnalyzed;
    const avgDeviation = totalDeviation / totalAnalyzed;
    // Start from fair ratio, penalize by deviation magnitude
    score = Math.round(Math.max(0, Math.min(1, fairRatio * 0.7 + (1 - Math.min(avgDeviation / 0.30, 1)) * 0.3)) * 100);
  }

  return {
    score,
    breakdown: {
      totalAnalyzed,
      fairlyPriced: totalFairlyPriced,
      overvalued: totalOvervalued,
      undervalued: totalUndervalued,
      avgDeviationPercent: totalAnalyzed > 0 ? Math.round((totalDeviation / totalAnalyzed) * 10000) / 100 : 0,
      propertiesWithOpinions: totalAnalyzed,
      propertiesWithoutOpinions: properties.length - totalAnalyzed,
    },
    propertyPVI,
  };
}

// ─── EVS: Engagement Velocity Score ─────────────────────────────────────────

/**
 * How fast properties attract interest after listing.
 * Uses time-to-first-opinion, opinions-per-day, and engagement depth.
 */
export function calculateEVS(properties, offers, likes, engagement = [], weights = DEFAULT_WEIGHTS.evs) {
  if (!properties.length) return { score: 0, breakdown: {} };

  const opinions = offers.filter((o) => o.type === 'opinion');
  const now = Date.now();
  const DAY_MS = 86400000;

  let totalTimeToFirst = 0;
  let propertiesWithOpinions = 0;
  let totalOpinionsPerDay = 0;

  for (const p of properties) {
    const created = toTimestamp(p.createdAt);
    if (!created) continue;

    const propOpinions = opinions.filter((o) => o.propertyId === p.id);
    if (propOpinions.length === 0) continue;

    // Time to first opinion
    const firstOpinionTime = Math.min(
      ...propOpinions.map((o) => toTimestamp(o.createdAt) || Infinity)
    );
    if (firstOpinionTime !== Infinity) {
      const daysToFirst = (firstOpinionTime - created) / DAY_MS;
      totalTimeToFirst += Math.max(0, daysToFirst);
      propertiesWithOpinions++;
    }

    // Opinions per day since listing
    const ageDays = Math.max(1, (now - created) / DAY_MS);
    totalOpinionsPerDay += propOpinions.length / ageDays;
  }

  // Time to first: lower is better (invert). 7 days = score 0, 0 days = score 1
  const avgTimeToFirst = propertiesWithOpinions > 0 ? totalTimeToFirst / propertiesWithOpinions : 7;
  const timeToFirstScore = Math.max(0, 1 - avgTimeToFirst / 7);

  // Opinions per day per property: higher is better
  const avgOpinionsPerDay = propertiesWithOpinions > 0 ? totalOpinionsPerDay / propertiesWithOpinions : 0;
  const opinionsPerDayScore = Math.min(avgOpinionsPerDay / 2, 1); // 2+ opinions/day/property = max

  // Engagement depth from opinions + likes + propertyEngagement sessions
  const engagedProperties = new Set([
    ...opinions.map((o) => o.propertyId),
    ...likes.map((l) => l.propertyId),
    ...engagement.map((e) => e.propertyId),
  ]).size;
  const engagementDepth = properties.length > 0 ? engagedProperties / properties.length : 0;

  // Engagement quality: average view duration and opinion conversion from tracked sessions
  let engagementQuality = 0;
  if (engagement.length > 0) {
    const avgViewDuration = engagement.reduce((sum, e) => sum + (e.viewDurationMs || 0), 0) / engagement.length;
    const opinionConversion = engagement.filter((e) => e.opinionCompleted).length / engagement.length;
    // Normalize: 60s+ view = max duration score, 50%+ conversion = max conversion score
    const durationScore = Math.min(avgViewDuration / 60000, 1);
    const conversionScore = Math.min(opinionConversion / 0.5, 1);
    engagementQuality = durationScore * 0.5 + conversionScore * 0.5;
  }

  // Weight engagement quality as a bonus (up to 10% boost)
  const raw =
    timeToFirstScore * weights.timeToFirst +
    opinionsPerDayScore * weights.opinionsPerDay +
    engagementDepth * weights.engagementDepth +
    engagementQuality * 0.1;

  return {
    score: Math.round(Math.min(raw, 1) * 100),
    breakdown: {
      avgTimeToFirstOpinionDays: Math.round(avgTimeToFirst * 10) / 10,
      avgOpinionsPerDay: Math.round(avgOpinionsPerDay * 100) / 100,
      engagedPropertyRatio: Math.round(engagementDepth * 100) / 100,
      propertiesWithOpinions,
      totalProperties: properties.length,
      engagementSessions: engagement.length,
      engagementQuality: Math.round(engagementQuality * 100) / 100,
    },
  };
}

// ─── BQI: Buyer Quality Index ───────────────────────────────────────────────

/**
 * Financial readiness and seriousness of the buyer pool.
 */
export function calculateBQI(properties, offers, weights = DEFAULT_WEIGHTS.bqi) {
  if (!properties.length) return { score: 0, breakdown: {} };

  const opinions = offers.filter((o) => o.type === 'opinion');
  if (!opinions.length) return { score: 0, breakdown: { totalOpinions: 0 } };

  // Seriousness distribution
  const levelWeights = { just_browsing: 0.1, interested: 0.4, very_interested: 0.7, ready_to_buy: 1.0 };
  const seriousnessScores = opinions.map((o) => {
    const level = (o.seriousnessLevel || '').toLowerCase();
    return levelWeights[level] || 0.25;
  });
  const avgSeriousness = seriousnessScores.reduce((a, b) => a + b, 0) / seriousnessScores.length;

  // Buyer type quality (pre-approved, investors typically more serious)
  const buyerTypeWeights = { investor: 0.8, first_home_buyer: 0.6, upgrader: 0.7, downsizer: 0.7 };
  const typedBuyers = opinions.filter((o) => o.buyerType || o.isInvestor || o.isFirstHomeBuyer);
  let buyerTypeScore = 0.5; // default mid
  if (typedBuyers.length > 0) {
    const typeScores = typedBuyers.map((o) => {
      if (o.isInvestor) return buyerTypeWeights.investor;
      if (o.isFirstHomeBuyer) return buyerTypeWeights.first_home_buyer;
      return buyerTypeWeights[o.buyerType] || 0.5;
    });
    buyerTypeScore = typeScores.reduce((a, b) => a + b, 0) / typeScores.length;
  }

  // Financial readiness signal: serious flag + has offer amount
  const financiallyReady = opinions.filter((o) => {
    const hasAmount = parseFloat(o.offerAmount) > 0;
    return o.serious === true && hasAmount;
  }).length;
  const financialReadiness = Math.min(financiallyReady / Math.max(opinions.length, 1), 1);

  const raw =
    avgSeriousness * weights.seriousness +
    buyerTypeScore * weights.buyerType +
    financialReadiness * weights.financialReady;

  // Distribution counts
  const distribution = {};
  for (const o of opinions) {
    const level = (o.seriousnessLevel || 'unknown').toLowerCase();
    distribution[level] = (distribution[level] || 0) + 1;
  }

  return {
    score: Math.round(Math.min(raw, 1) * 100),
    breakdown: {
      totalOpinions: opinions.length,
      avgSeriousness: Math.round(avgSeriousness * 100) / 100,
      buyerTypeScore: Math.round(buyerTypeScore * 100) / 100,
      financiallyReadyCount: financiallyReady,
      financialReadiness: Math.round(financialReadiness * 100) / 100,
      seriousnessDistribution: distribution,
    },
  };
}

// ─── FPI: Forward Pipeline Index ────────────────────────────────────────────

/**
 * Strength of upcoming supply pipeline.
 * Excludes on-market properties (they're already listed).
 */
export function calculateFPI(properties, weights = DEFAULT_WEIGHTS.fpi) {
  if (!properties.length) return { score: 0, breakdown: {} };

  const now = Date.now();
  const DAY_MS = 86400000;
  const { onMarket, premarket, offMarket } = segmentProperties(properties);

  // Only premarket + off-market count toward pipeline
  const pipeline = [...premarket, ...offMarket];

  const gtm30 = pipeline.filter((p) => {
    const goal = toTimestamp(p.gotoMarketGoal);
    return goal && goal > now && goal <= now + 30 * DAY_MS;
  });
  const gtm60 = pipeline.filter((p) => {
    const goal = toTimestamp(p.gotoMarketGoal);
    return goal && goal > now && goal <= now + 60 * DAY_MS;
  });
  const gtm90 = pipeline.filter((p) => {
    const goal = toTimestamp(p.gotoMarketGoal);
    return goal && goal > now && goal <= now + 90 * DAY_MS;
  });

  // Eager sellers in pipeline (with reduced weight for off-market)
  const eagerInPipeline = pipeline.reduce((sum, p) => {
    const weight = getEagernessWeight(p);
    const isOffMarket = !p.visibility || p.active === false;
    return sum + weight * (isOffMarket ? 0.5 : 1.0);
  }, 0);

  // New listings growth: properties created in last 30 days vs 30-60 days ago
  const recent = pipeline.filter((p) => {
    const created = toTimestamp(p.createdAt);
    return created && created > now - 30 * DAY_MS;
  }).length;
  const previous = pipeline.filter((p) => {
    const created = toTimestamp(p.createdAt);
    return created && created > now - 60 * DAY_MS && created <= now - 30 * DAY_MS;
  }).length;
  const growthRatio = previous > 0 ? (recent - previous) / previous : recent > 0 ? 1 : 0;
  const growthScore = Math.max(0, Math.min(1, (growthRatio + 1) / 2)); // normalize -1..1 to 0..1

  const normGtm30 = Math.min(gtm30.length / NORMALIZATION.MAX_GTM, 1);
  const normGtm60 = Math.min(gtm60.length / NORMALIZATION.MAX_GTM, 1);
  const normGtm90 = Math.min(gtm90.length / NORMALIZATION.MAX_GTM, 1);
  const normEager = Math.min(eagerInPipeline / NORMALIZATION.MAX_EAGER, 1);

  const raw =
    normGtm30 * weights.gtm30 +
    normGtm60 * weights.gtm60 +
    normGtm90 * weights.gtm90 +
    normEager * weights.eager +
    growthScore * weights.growth;

  return {
    score: Math.round(Math.min(raw, 1) * 100),
    breakdown: {
      pipelineTotal: pipeline.length,
      premarketCount: premarket.length,
      offMarketCount: offMarket.length,
      onMarketCount: onMarket.length,
      gtm30: gtm30.length,
      gtm60: gtm60.length,
      gtm90: gtm90.length,
      eagerInPipeline: Math.round(eagerInPipeline * 100) / 100,
      recentListings: recent,
      previousPeriodListings: previous,
      growthPercent: Math.round(growthRatio * 100),
    },
  };
}

// ─── SDB: Supply-Demand Balance ─────────────────────────────────────────────

/**
 * Supply vs demand ratio. >50 = seller's market, <50 = buyer's market, 50 = balanced.
 * Supply = on-market count. Demand = opinions + likes across all properties.
 */
export function calculateSDB(properties, offers, likes) {
  if (!properties.length) return { score: 50, breakdown: {} };

  const { onMarket } = segmentProperties(properties);
  const supplyCount = onMarket.length;

  const opinions = offers.filter((o) => o.type === 'opinion');
  const demandSignals = opinions.length + likes.length;

  // Normalize: more demand relative to supply = seller's market (>50)
  // Target ratio: ~5 demand signals per property = balanced
  const demandPerSupply = supplyCount > 0 ? demandSignals / supplyCount : demandSignals > 0 ? 10 : 0;
  const BALANCED_RATIO = 5;

  // Map to 0-100: ratio > BALANCED = seller's market, < BALANCED = buyer's market
  let score;
  if (demandPerSupply >= BALANCED_RATIO) {
    // Seller's market: 50-100
    score = 50 + Math.min((demandPerSupply - BALANCED_RATIO) / BALANCED_RATIO, 1) * 50;
  } else {
    // Buyer's market: 0-50
    score = (demandPerSupply / BALANCED_RATIO) * 50;
  }

  // Handle edge case: no supply at all but demand exists = extreme seller's market
  if (supplyCount === 0 && demandSignals > 0) score = 90;
  // No demand and no supply = neutral
  if (supplyCount === 0 && demandSignals === 0) score = 50;

  return {
    score: Math.round(score),
    breakdown: {
      onMarketSupply: supplyCount,
      totalDemandSignals: demandSignals,
      opinions: opinions.length,
      likes: likes.length,
      demandPerSupply: Math.round(demandPerSupply * 100) / 100,
      marketType: score > 55 ? "seller's market" : score < 45 ? "buyer's market" : 'balanced',
    },
  };
}

// ─── MHI: Market Heat Index ─────────────────────────────────────────────────

/**
 * Composite market activity and momentum.
 * Derived from BDI, SMI, EVS, and PVI.
 */
export function calculateMHI(bdiScore, smiScore, evsScore, pviScore, weights = DEFAULT_WEIGHTS.mhi) {
  const raw =
    (bdiScore / 100) * weights.bdi +
    (smiScore / 100) * weights.smi +
    (evsScore / 100) * weights.evs +
    (pviScore / 100) * weights.pvi;

  return {
    score: Math.round(Math.min(raw, 1) * 100),
    breakdown: {
      bdiContribution: Math.round(bdiScore * weights.bdi),
      smiContribution: Math.round(smiScore * weights.smi),
      evsContribution: Math.round(evsScore * weights.evs),
      pviContribution: Math.round(pviScore * weights.pvi),
    },
  };
}

// ─── Compute All PHI Scores ─────────────────────────────────────────────────

/**
 * Calculate all 8 PHI metrics for a set of properties.
 * Returns { phi: { bdi, smi, pvi, mhi, evs, bqi, fpi, sdb }, phiBreakdown: {} }
 */
export function computeAllPHI(properties, offers, likes, engagement = [], weights = DEFAULT_WEIGHTS) {
  const bdi = calculateBDI(properties, offers, likes, weights.bdi);
  const smi = calculateSMI(properties, weights.smi);
  const pvi = calculatePVI(properties, offers, weights.pvi);
  const evs = calculateEVS(properties, offers, likes, engagement, weights.evs);
  const bqi = calculateBQI(properties, offers, weights.bqi);
  const fpi = calculateFPI(properties, weights.fpi);
  const sdb = calculateSDB(properties, offers, likes);
  const mhi = calculateMHI(bdi.score, smi.score, evs.score, pvi.score, weights.mhi);

  return {
    phi: {
      bdi: bdi.score,
      smi: smi.score,
      pvi: pvi.score,
      mhi: mhi.score,
      evs: evs.score,
      bqi: bqi.score,
      fpi: fpi.score,
      sdb: sdb.score,
    },
    phiBreakdown: {
      bdi: bdi.breakdown,
      smi: smi.breakdown,
      pvi: pvi.breakdown,
      mhi: mhi.breakdown,
      evs: evs.breakdown,
      bqi: bqi.breakdown,
      fpi: fpi.breakdown,
      sdb: sdb.breakdown,
    },
    propertyPVI: pvi.propertyPVI || [],
  };
}

// ─── Data Confidence ─────────────────────────────────────────────────────────

/**
 * Compute a confidence assessment for PHI scores based on data quality.
 * Returns { level, score, factors, warnings }.
 */
export function computeConfidence(properties, offers, likes) {
  const opinions = (offers || []).filter((o) => o.type === 'opinion');
  const seriousBuyers = opinions.filter((o) => o.serious === true);
  const propertyCount = (properties || []).length;
  const opinionCount = opinions.length;
  const seriousBuyerCount = seriousBuyers.length;
  const avgOpinionsPerProperty = propertyCount > 0 ? opinionCount / propertyCount : 0;

  // Data freshness: % of opinions from last 30 days
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;
  const recentOpinions = opinions.filter((o) => {
    const ts = toTimestamp(o.createdAt);
    return ts && ts >= thirtyDaysAgo;
  }).length;
  const recentOpinionPercent = opinionCount > 0 ? Math.round((recentOpinions / opinionCount) * 100) : 0;

  // Weighted confidence score (0-100)
  const propScore = Math.min(propertyCount / 10, 1) * 20;       // 20% weight, 10+ = max
  const opinionScore = Math.min(opinionCount / 20, 1) * 30;     // 30% weight, 20+ = max
  const seriousScore = Math.min(seriousBuyerCount / 5, 1) * 15; // 15% weight, 5+ = max
  const avgScore = Math.min(avgOpinionsPerProperty / 3, 1) * 20; // 20% weight, 3+ per prop = max
  const freshnessScore = (recentOpinionPercent / 100) * 15;      // 15% weight

  const score = Math.round(propScore + opinionScore + seriousScore + avgScore + freshnessScore);

  // Level thresholds
  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

  // Warnings
  const warnings = [];
  if (propertyCount < 3) warnings.push(`Only ${propertyCount} propert${propertyCount === 1 ? 'y' : 'ies'} found — scores may not be representative.`);
  if (opinionCount === 0) warnings.push('No buyer opinions recorded — demand metrics are estimated.');
  else if (opinionCount < 5) warnings.push(`Only ${opinionCount} opinion${opinionCount === 1 ? '' : 's'} — scores are preliminary.`);
  if (recentOpinionPercent < 30 && opinionCount > 0) warnings.push('Most data is older than 30 days — scores may not reflect current conditions.');

  return {
    level,
    score,
    factors: {
      propertyCount,
      opinionCount,
      seriousBuyerCount,
      avgOpinionsPerProperty: Math.round(avgOpinionsPerProperty * 100) / 100,
      recentOpinionPercent,
    },
    warnings,
  };
}
