import { NextResponse } from 'next/server';
import { getCredentials, syncContacts, updateSyncStatus } from '../../../../api/services/agentboxService';

export async function POST(request) {
  try {
    const { uid, modifiedAfter } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const creds = await getCredentials(uid);
    if (!creds || creds.status !== 'connected') {
      return NextResponse.json({ error: 'Not connected to Agentbox' }, { status: 400 });
    }

    const options = {};
    if (modifiedAfter) options.modifiedAfter = modifiedAfter;

    const result = await syncContacts(uid, creds.clientId, creds.apiKey, options);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      total: result.total,
      errors: result.errors.length,
    });
  } catch (err) {
    console.error('Agentbox contact sync error:', err);
    return NextResponse.json({ error: 'Failed to sync contacts' }, { status: 500 });
  }
}
