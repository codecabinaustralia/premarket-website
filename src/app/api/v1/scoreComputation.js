import { adminDb } from '../../firebase/adminApp';
import {
  geocodeLocation,
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
 * Australian state abbreviations for parsing address strings.
 */
const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

/**
 * Common street suffixes — if an address contains these, it's a street address not a suburb.
 */
const STREET_SUFFIXES = new Set([
  'street', 'st', 'road', 'rd', 'drive', 'dr', 'avenue', 'ave', 'way',
  'lane', 'ln', 'place', 'pl', 'court', 'ct', 'crescent', 'cres', 'cr',
  'circuit', 'cct', 'parade', 'pde', 'terrace', 'tce', 'boulevard', 'blvd',
  'highway', 'hwy', 'close', 'cl', 'grove', 'gr', 'view', 'rise', 'trail',
  'esplanade', 'esp', 'promenade', 'walk', 'mews', 'gardens', 'meadows',
]);

/**
 * Extract suburb + state from a text segment like "Bondi NSW 2026".
 * Words before the state abbreviation (excluding numbers) become the suburb.
 */
function parseSuburbFromSegment(text) {
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    if (AU_STATES.includes(words[i].toUpperCase())) {
      const state = words[i].toUpperCase();
      const suburbWords = words.slice(0, i).filter((w) => !/^\d+$/.test(w));
      if (suburbWords.length > 0) {
        return { suburb: suburbWords.join(' '), state };
      }
    }
  }
  return null;
}

/**
 * Extract suburb and state from property data.
 * Priority: direct fields > formattedAddress parsing > address string (suburb-only format).
 */
function extractSuburbState(data) {
  // Strategy 1: direct suburb/state fields (AgentBox imports, Flutter app)
  const suburb = data.suburb || data.location?.suburb || data.address?.suburb || '';
  const state = data.state || data.location?.state || data.address?.state || '';
  if (suburb && state) return { suburb, state };

  // Strategy 2: parse formattedAddress (most reliable — comma-separated)
  // e.g. "8/19 Tanglewood Dr, Tanglewood NSW 2478, Australia"
  // We look for the segment with a state abbreviation (skipping the street segment)
  const formatted = data.formattedAddress || '';
  if (formatted) {
    const segments = formatted.split(',').map((s) => s.trim());
    for (const seg of segments) {
      // Skip segments that look like a street address
      const segWords = seg.split(/\s+/);
      const hasStreet = segWords.some((w) => STREET_SUFFIXES.has(w.toLowerCase()));
      if (hasStreet) continue;
      const result = parseSuburbFromSegment(seg);
      if (result) return result;
    }
    // If no non-street segment matched, try all segments (fallback)
    for (const seg of segments) {
      const result = parseSuburbFromSegment(seg);
      if (result) return result;
    }
  }

  // Strategy 3: raw address string — only if it's a simple suburb format (no street suffixes)
  const addr = typeof data.address === 'string' ? data.address : '';
  if (addr) {
    const addrWords = addr.split(/\s+/);
    const hasStreet = addrWords.some((w) => STREET_SUFFIXES.has(w.toLowerCase()));
    if (!hasStreet) {
      const result = parseSuburbFromSegment(addr);
      if (result) return result;
    }
  }

  return { suburb: suburb || null, state: state || null };
}

/**
 * Get all unique suburbs from active properties.
 * Returns array of { key, suburb, state, postcode, lat, lng }.
 */
export async function getUniqueSuburbs(maxAgeDays) {
  const snapshot = await adminDb.collection('properties').get();
  const suburbMap = {};
  const cutoff = maxAgeDays ? Date.now() - maxAgeDays * 86400000 : null;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Skip inactive/archived
    if (data.active === false || data.archived === true) continue;
    // Skip old properties if time filter set
    if (cutoff) {
      const created = toTimestamp(data.createdAt);
      if (created && created < cutoff) continue;
    }

    const { suburb, state } = extractSuburbState(data);
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
export async function computeSuburbScores(suburb, state, lat, lng, { maxAgeDays } = {}) {
  // Geocode if coordinates missing
  if (!lat || !lng) {
    try {
      const geo = await geocodeLocation({ suburb, state });
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }
    } catch (err) {
      console.error(`Geocoding failed for ${suburb}, ${state}:`, err.message);
    }
    if (!lat || !lng) return null;
  }

  const properties = await getPropertiesInRadius(lat, lng, 10, { maxAgeDays });
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
 * Delete all documents in the marketScores collection.
 * Call before recomputing to remove stale entries with bad suburb names.
 */
export async function clearAllMarketScores() {
  const snapshot = await adminDb.collection('marketScores').get();
  if (snapshot.empty) return 0;
  const docs = snapshot.docs;
  // Delete in batches of 500 (Firestore limit)
  for (let i = 0; i < docs.length; i += 500) {
    const batch = adminDb.batch();
    const chunk = docs.slice(i, i + 500);
    for (const d of chunk) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
  return docs.length;
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
