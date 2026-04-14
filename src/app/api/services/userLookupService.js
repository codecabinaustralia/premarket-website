import { adminDb } from '../../firebase/adminApp';
import { normalizeE164 } from '../../utils/phone';
import { geocodeLocation, haversineDistance } from '../v1/helpers';

/**
 * Find a sender enrolled in SMS by their E.164 phone number.
 *
 * Resolution order:
 *   1. `users` collection where smsPhone == phone AND smsEnabled == true
 *      (direct Premarket account with SMS on).
 *   2. `agents` collection (team member sub-profile) where the same holds;
 *      we then load the parent user and return a merged record.
 *
 * Returned shape:
 *   {
 *     uid: <parent user id>,          // always the owning account
 *     email, firstName, lastName,      // for AI addressing + report email
 *     photoURL, superAdmin, ...rest,
 *     senderKind: 'user' | 'agent',    // who actually texted
 *     senderName,                      // first name used to greet in SMS
 *     agent: { id, name, ... } | null, // populated when senderKind === 'agent'
 *     smsPhone,                        // E.164 number that matched
 *   }
 *
 * Returns null when no enrolled match exists.
 */
export async function findSenderByPhone(e164Phone) {
  const phone = normalizeE164(e164Phone);
  if (!phone) return null;

  // 1. Direct user match
  const userSnap = await adminDb
    .collection('users')
    .where('smsPhone', '==', phone)
    .where('smsEnabled', '==', true)
    .limit(1)
    .get();

  if (!userSnap.empty) {
    const doc = userSnap.docs[0];
    const data = doc.data() || {};
    return {
      uid: doc.id,
      ...data,
      senderKind: 'user',
      senderName: firstNameFromUser(data),
      agent: null,
      smsPhone: phone,
    };
  }

  // 2. Team-member (agent sub-profile) match
  const agentSnap = await adminDb
    .collection('agents')
    .where('smsPhone', '==', phone)
    .where('smsEnabled', '==', true)
    .limit(1)
    .get();

  if (!agentSnap.empty) {
    const agentDoc = agentSnap.docs[0];
    const agentData = agentDoc.data() || {};
    const parentUserId = agentData.userId;
    if (!parentUserId) return null;

    const parentDoc = await adminDb.collection('users').doc(parentUserId).get();
    if (!parentDoc.exists) return null;
    const parentData = parentDoc.data() || {};

    return {
      uid: parentDoc.id,
      ...parentData,
      senderKind: 'agent',
      senderName: firstNameFromAgent(agentData) || firstNameFromUser(parentData),
      agent: { id: agentDoc.id, ...agentData },
      smsPhone: phone,
    };
  }

  return null;
}

/**
 * @deprecated Use findSenderByPhone. Kept so existing callers keep working
 * until we finish migrating the Twilio webhook + handler.
 */
export async function findUserByPhone(e164Phone) {
  return findSenderByPhone(e164Phone);
}

/**
 * Search the sender's own properties for one that matches a free-text query.
 *
 * Resolution strategy:
 *   1. Empty / "latest" → newest property.
 *   2. Fuzzy text match against title, address, formattedAddress.
 *   3. If fuzzy match is low-confidence, geocode the query via Mapbox and
 *      find the closest property by lat/lng (within 0.5 km). This handles
 *      partial addresses like "12 Pacific Ave" that don't substring-match.
 */
export async function searchPropertiesForUser(user, query) {
  if (!user?.uid) return null;

  const q = (query || '').toLowerCase().trim();
  const wantLatest = isLatestQuery(q);

  const snap = await adminDb
    .collection('properties')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .limit(wantLatest ? 1 : 25)
    .get();

  if (snap.empty) return null;

  if (wantLatest) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }

  const fuzzy = bestFuzzyMatch(snap.docs, q);
  if (fuzzy) return fuzzy;

  // Fuzzy match failed — geocode the query and proximity-match
  return geocodeAndMatch(snap.docs, q);
}

/**
 * Superadmin-only: search ALL properties across the platform. Uses a
 * collectionGroup-style scan limited to the most recent 200 listings to keep
 * costs sane. Suitable for "latest", address lookups, or "show me vendor Y"
 * style queries from the admin's phone.
 */
export async function searchAllProperties(query) {
  const q = (query || '').toLowerCase().trim();
  const wantLatest = isLatestQuery(q);

  const snap = await adminDb
    .collection('properties')
    .orderBy('createdAt', 'desc')
    .limit(wantLatest ? 1 : 200)
    .get();

  if (snap.empty) return null;

  if (wantLatest) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }

  const fuzzy = bestFuzzyMatch(snap.docs, q);
  if (fuzzy) return fuzzy;

  return geocodeAndMatch(snap.docs, q);
}

/**
 * Enforce that a property belongs to the caller, unless the caller is a
 * superadmin (in which case everything is fair game). Returns `true` when
 * access is allowed, `false` otherwise.
 */
export function assertOwnership(user, property) {
  if (!user || !property) return false;
  if (user.superAdmin === true) return true;
  return property.userId && property.userId === user.uid;
}

// -----------------------------------------------------------------------------
// Back-compat shim for the original handler. Prefer searchPropertiesForUser.
// -----------------------------------------------------------------------------
export async function resolvePropertyForUser(user, query) {
  return searchPropertiesForUser(user, query);
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

function isLatestQuery(q) {
  if (!q) return true;
  return (
    q === 'latest' ||
    q === 'last' ||
    q === 'most recent' ||
    q === 'newest' ||
    q === 'my latest' ||
    q === 'latest property' ||
    q === 'newest property'
  );
}

function firstNameFromUser(data) {
  if (!data) return 'there';
  if (data.firstName) return String(data.firstName).trim();
  if (data.name) return String(data.name).split(/\s+/)[0];
  if (data.displayName) return String(data.displayName).split(/\s+/)[0];
  return 'there';
}

function firstNameFromAgent(data) {
  if (!data?.name) return null;
  return String(data.name).split(/\s+/)[0];
}

/**
 * Geocode a free-text address query via Mapbox and find the nearest property
 * within GEOCODE_RADIUS_KM. Used as a fallback when fuzzy text matching
 * fails — covers partial addresses, abbreviations, missing postcodes, etc.
 */
const GEOCODE_RADIUS_KM = 0.5;

async function geocodeAndMatch(docs, q) {
  if (!q) return null;
  try {
    const geo = await geocodeLocation({ location: q + ', Australia' });
    if (!geo) return null;

    const candidates = docs.map((d) => ({ id: d.id, ...d.data() }));
    let best = null;
    let bestDist = GEOCODE_RADIUS_KM;

    for (const c of candidates) {
      const lat = c.location?.latitude;
      const lng = c.location?.longitude;
      if (lat == null || lng == null) continue;
      const dist = haversineDistance(geo.lat, geo.lng, lat, lng);
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }

    return best;
  } catch (err) {
    // Geocoding failure shouldn't break the SMS flow — just return no match.
    console.warn('[userLookup] geocode fallback failed:', err?.message);
    return null;
  }
}

function bestFuzzyMatch(docs, q) {
  if (!q) return null;
  const candidates = docs.map((d) => ({ id: d.id, ...d.data() }));

  const score = (c) => {
    const hay = [
      c.title,
      c.address,
      c.formattedAddress,
      c.addressObj?.street,
      c.addressObj?.suburb,
      c.addressObj?.state,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!hay) return 0;
    if (hay.includes(q)) return 100;
    const tokens = q.split(/\s+/).filter(Boolean);
    if (!tokens.length) return 0;
    let hit = 0;
    for (const t of tokens) if (hay.includes(t)) hit++;
    return Math.round((hit / tokens.length) * 60);
  };

  let best = null;
  let bestScore = 0;
  for (const c of candidates) {
    const s = score(c);
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return bestScore >= 30 ? best : null;
}
