import { adminDb } from '../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

const CORELOGIC_CLIENT_ID = process.env.CORELOGIC_CLIENT_ID;
const CORELOGIC_CLIENT_SECRET = process.env.CORELOGIC_CLIENT_SECRET;

let corelogicToken = null;
let tokenExpiry = 0;

async function getCorelogicToken() {
  const now = Date.now();
  if (corelogicToken && now < tokenExpiry) {
    return corelogicToken;
  }

  const authString = Buffer.from(`${CORELOGIC_CLIENT_ID}:${CORELOGIC_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(
    'https://api.corelogic.asia/access/as/token.oauth2?grant_type=client_credentials',
    {
      method: 'POST',
      headers: {
        'Content-Length': '0',
        Authorization: `Basic ${authString}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh CoreLogic token (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  corelogicToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000;
  return corelogicToken;
}

async function corelogicFetch(url) {
  const token = await getCorelogicToken();
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CoreLogic API call failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function getPropertyIdAndSave(address, userId) {
  if (!address) throw new Error('Address is required');

  const data = await corelogicFetch(
    `https://api-sbox.corelogic.asia/search/au/matcher/address?q=${encodeURIComponent(address)}`
  );

  const propertyId = data?.matchDetails?.propertyId || null;

  const docRef = await adminDb.collection('coreProperties').add({
    address,
    propertyId,
    status: 'started',
    meta: data,
    userId,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id, propertyId, meta: data };
}

export async function getProperty(propertyId, corePropertyId) {
  if (!propertyId) throw new Error('propertyId is required');
  if (!corePropertyId) throw new Error('corePropertyId is required');

  const data = await corelogicFetch(
    `https://api-sbox.corelogic.asia/property-details/au/properties/${propertyId}/images`
  );

  await adminDb.collection('coreProperties').doc(corePropertyId).update({
    images: data,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return data;
}
