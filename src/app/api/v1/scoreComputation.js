import { adminDb } from '../../firebase/adminApp';
import {
  getPropertiesInRadius,
  getOffersForProperties,
  getLikesForProperties,
  calculateBuyerScore,
  calculateSellerScore,
  median,
  formatPrice,
} from './helpers';

/**
 * Slugify a suburb name for use as a Firestore document ID.
 */
export function slugify(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build a document key for a suburb: "{suburb_slug}_{state_lowercase}"
 */
export function suburbKey(suburb, state) {
  return `${slugify(suburb)}_${(state || '').toLowerCase()}`;
}

/**
 * Get all unique suburbs from the properties collection.
 * Returns array of { suburb, state, postcode, lat, lng }.
 */
export async function getUniqueSuburbs() {
  const snapshot = await adminDb.collection('properties').get();
  const suburbMap = {};

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const suburb = data.suburb || data.location?.suburb;
    const state = data.state || data.location?.state;
    if (!suburb || !state) continue;

    const key = suburbKey(suburb, state);
    if (!suburbMap[key]) {
      suburbMap[key] = {
        suburb,
        state,
        postcode: data.postcode || data.location?.postcode || null,
        lat: data.location?.latitude || null,
        lng: data.location?.longitude || null,
      };
    }
  }

  return Object.entries(suburbMap).map(([key, data]) => ({ key, ...data }));
}

/**
 * Compute buyer and seller scores for a single suburb.
 * Uses a 10km radius from the suburb center point.
 */
export async function computeSuburbScores(suburb, state, lat, lng) {
  if (!lat || !lng) return null;

  const properties = await getPropertiesInRadius(lat, lng, 10);
  if (!properties.length) return null;

  const propertyIds = properties.map((p) => p.id);
  const [offers, likes] = await Promise.all([
    getOffersForProperties(propertyIds),
    getLikesForProperties(propertyIds),
  ]);

  const buyerResult = calculateBuyerScore(properties, offers, likes);
  const sellerResult = calculateSellerScore(properties);

  // Forecast: properties going to market in next 30 days
  const now = Date.now();
  const DAY_MS = 86400000;
  const goingToMarket = properties.filter((p) => {
    const goal = toTimestamp(p.gotoMarketGoal);
    return goal && goal > now && goal <= now + 30 * DAY_MS;
  });

  const prices = goingToMarket
    .map((p) => parseFloat(String(p.price).replace(/[^0-9.]/g, '')))
    .filter((n) => !isNaN(n) && n > 0);
  const medianPrice = median(prices) || null;

  // Demand ratio
  const opinions = offers.filter((o) => o.type === 'opinion');
  let demandRatio = null;
  if (opinions.length > 0) {
    const offerAmounts = opinions
      .map((o) => parseFloat(o.offerAmount) || 0)
      .filter((a) => a > 0);
    const allPrices = properties
      .map((p) => parseFloat(String(p.price).replace(/[^0-9.]/g, '')))
      .filter((n) => !isNaN(n) && n > 0);
    if (offerAmounts.length > 0 && allPrices.length > 0) {
      const medianOffer = median(offerAmounts);
      const medianListingPrice = median(allPrices);
      if (medianListingPrice > 0) {
        demandRatio = Math.round((medianOffer / medianListingPrice) * 100) / 100;
      }
    }
  }

  return {
    buyerScore: buyerResult.score,
    buyerScoreBreakdown: buyerResult.breakdown,
    sellerScore: sellerResult.score,
    sellerScoreBreakdown: sellerResult.breakdown,
    forecastNext30: {
      count: goingToMarket.length,
      medianPrice,
      demandRatio,
    },
    propertyCount: properties.length,
  };
}

/**
 * Write computed scores to the marketScores collection.
 */
export async function writeScoreToFirestore(key, suburb, state, postcode, lat, lng, scores) {
  const { FieldValue } = await import('firebase-admin/firestore');
  await adminDb.collection('marketScores').doc(key).set(
    {
      suburb,
      state,
      postcode,
      lat,
      lng,
      ...scores,
      computedAt: FieldValue.serverTimestamp(),
      stale: false,
    },
    { merge: true }
  );
}

/**
 * Write monthly trend snapshot to the marketTrends collection.
 */
export async function writeTrendToFirestore(key, suburb, state, monthKey, scores) {
  const { FieldValue } = await import('firebase-admin/firestore');
  await adminDb.collection('marketTrends').doc(key).set(
    {
      suburb,
      state,
      monthKey,
      buyerScore: scores.buyerScore,
      sellerScore: scores.sellerScore,
      propertyCount: scores.propertyCount,
      computedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Read cached score for a suburb. Returns null if not found.
 */
export async function getCachedScore(suburb, state) {
  const key = suburbKey(suburb, state);
  const doc = await adminDb.collection('marketScores').doc(key).get();
  if (!doc.exists) return null;
  return { key, ...doc.data() };
}

/**
 * Read cached score by key. Returns null if not found.
 */
export async function getCachedScoreByKey(key) {
  const doc = await adminDb.collection('marketScores').doc(key).get();
  if (!doc.exists) return null;
  return { key, ...doc.data() };
}

/**
 * Get all cached scores (for trending-areas).
 */
export async function getAllCachedScores() {
  const snapshot = await adminDb.collection('marketScores').get();
  return snapshot.docs.map((doc) => ({ key: doc.id, ...doc.data() }));
}

/**
 * Get all stale scores.
 */
export async function getStaleCachedScores() {
  const snapshot = await adminDb
    .collection('marketScores')
    .where('stale', '==', true)
    .get();
  return snapshot.docs.map((doc) => ({ key: doc.id, ...doc.data() }));
}

/**
 * Get historical trends for a suburb.
 */
export async function getHistoricalTrends(suburb, state, months = 6) {
  const key = suburbKey(suburb, state);
  const snapshot = await adminDb
    .collection('marketTrends')
    .where('suburb', '==', suburb)
    .where('state', '==', state)
    .orderBy('monthKey', 'desc')
    .limit(months)
    .get();
  return snapshot.docs.map((doc) => ({ key: doc.id, ...doc.data() })).reverse();
}

function toTimestamp(val) {
  if (!val) return null;
  if (val.toMillis) return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}
