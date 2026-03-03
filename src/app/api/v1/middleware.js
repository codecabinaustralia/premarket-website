import { adminDb } from '../../firebase/adminApp';

/**
 * Validates an API key from the x-api-key header.
 * Looks up the user in Firestore where apiAccess.apiKey matches and status is 'approved'.
 */
export async function validateApiKey(request) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return { valid: false, error: 'Missing x-api-key header' };
  }

  try {
    const snapshot = await adminDb
      .collection('users')
      .where('apiAccess.apiKey', '==', apiKey)
      .where('apiAccess.status', '==', 'approved')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid or revoked API key' };
    }

    const userDoc = snapshot.docs[0];
    return { valid: true, user: { id: userDoc.id, ...userDoc.data() } };
  } catch (err) {
    console.error('API key validation error:', err);
    return { valid: false, error: 'Authentication failed' };
  }
}
