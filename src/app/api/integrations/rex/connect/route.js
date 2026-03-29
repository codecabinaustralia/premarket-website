import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../api/middleware/auth';
import { validateCredentials, storeCredentials, syncContacts, getAccessToken } from '../../../../api/services/rexService';
import { DEMO_OFFICES } from '../../../../api/services/rexDemoData';
import { adminDb } from '../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const uid = auth.uid;

    const body = await request.json();
    const { clientId, clientSecret, demo } = body;

    // Verify user exists
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already connected
    const existing = userDoc.data()?.integrations?.rex;
    if (existing?.status === 'connected') {
      return NextResponse.json({ error: 'Already connected. Disconnect first.' }, { status: 400 });
    }

    // Demo mode — skip real API validation, store demo flag
    if (demo) {
      await adminDb.collection('users').doc(uid).update({
        'integrations.rex': {
          clientId: 'demo',
          clientSecret: 'demo',
          accessToken: null,
          tokenExpiry: null,
          status: 'connected',
          mode: 'demo',
          connectedAt: FieldValue.serverTimestamp(),
          lastSync: null,
          lastSyncStatus: null,
          autoSync: false,
          offices: DEMO_OFFICES,
        },
      });

      return NextResponse.json({
        success: true,
        demo: true,
        offices: DEMO_OFFICES,
      });
    }

    // Real mode — validate credentials
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await validateCredentials(clientId, clientSecret);

    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Invalid credentials' }, { status: 401 });
    }

    // Store credentials
    await storeCredentials(uid, clientId, clientSecret, {
      accessToken: result.accessToken,
      offices: result.offices,
    });

    // Silently trigger contact sync in the background (don't block the response)
    syncContacts(uid, result.accessToken).catch(err => {
      console.error('Background Rex contact sync failed for', uid, err);
    });

    return NextResponse.json({
      success: true,
      offices: result.offices,
    });
  } catch (err) {
    console.error('Rex connect error:', err);
    return NextResponse.json({ error: 'Failed to connect to Rex' }, { status: 500 });
  }
}
