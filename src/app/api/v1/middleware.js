import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '../../firebase/adminApp';

/**
 * Validates either:
 *  - an API key from the x-api-key header (external integrations), or
 *  - a Firebase ID token from the Authorization: Bearer <token> header (signed-in users).
 *
 * External API-key callers are unchanged. Signed-in users unlock the same
 * v1 endpoints without us having to create proxy routes.
 *
 * Returns { valid: true, user, authType } on success.
 * authType is 'apiKey' or 'bearer'. user.id is the firestore uid.
 */
export async function validateApiKey(request) {
  // Prefer an explicit API key if present (keeps existing caller semantics).
  const apiKey = request.headers.get('x-api-key');

  if (apiKey) {
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
      return {
        valid: true,
        authType: 'apiKey',
        user: { id: userDoc.id, ...userDoc.data() },
      };
    } catch (err) {
      console.error('API key validation error:', err);
      return { valid: false, error: 'Authentication failed' };
    }
  }

  // Fall back to Firebase ID token.
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = await getAuth().verifyIdToken(token);
      // Load the user doc (some v1 handlers read from user.id/user.apiAccess).
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      return {
        valid: true,
        authType: 'bearer',
        user: { id: decoded.uid, email: decoded.email || null, ...userData },
      };
    } catch (err) {
      const message =
        err.code === 'auth/id-token-expired' ? 'Token expired' : 'Invalid token';
      return { valid: false, error: message };
    }
  }

  return {
    valid: false,
    error: 'Missing x-api-key header or Authorization: Bearer token',
  };
}
