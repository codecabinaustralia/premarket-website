import { NextResponse } from 'next/server';
import { validateCredentials, storeCredentials, syncContacts } from '../../../../api/services/agentboxService';
import { adminDb } from '../../../../firebase/adminApp';

export async function POST(request) {
  try {
    const { uid, clientId, apiKey } = await request.json();

    if (!uid || !clientId || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user exists
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already connected
    const existing = userDoc.data()?.integrations?.agentbox;
    if (existing?.status === 'connected') {
      return NextResponse.json({ error: 'Already connected. Disconnect first.' }, { status: 400 });
    }

    // Validate credentials against Agentbox API
    const result = await validateCredentials(clientId, apiKey);

    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Invalid credentials' }, { status: 401 });
    }

    // Store credentials
    await storeCredentials(uid, clientId, apiKey, result.offices);

    // Silently trigger contact sync in the background (don't block the response)
    syncContacts(uid, clientId, apiKey).catch(err => {
      console.error('Background contact sync failed for', uid, err);
    });

    return NextResponse.json({
      success: true,
      offices: result.offices,
    });
  } catch (err) {
    console.error('Agentbox connect error:', err);
    return NextResponse.json({ error: 'Failed to connect to Agentbox' }, { status: 500 });
  }
}
