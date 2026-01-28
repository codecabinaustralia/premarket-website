import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Check for service account JSON (recommended for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  // Fallback to individual credentials
  if (process.env.FIREBASE_PROJECT_ID) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  // Last resort: use project ID only (works in Google Cloud environments)
  return initializeApp({
    projectId: 'premarket-homes',
  });
}

const adminApp = getFirebaseAdmin();
const adminDb = getFirestore(adminApp);

export { adminDb };
