import { auth } from '../firebase/clientApp';

/**
 * Wrapper around fetch() that attaches the Firebase Auth ID token.
 * Use for all authenticated API calls from the client.
 */
export async function authFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const token = await user.getIdToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}
