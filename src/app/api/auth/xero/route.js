import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../middleware/auth';

const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize';

/**
 * GET /api/auth/xero
 * Initiate Xero OAuth 2.0 flow - redirects to Xero login.
 */
export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = process.env.XERO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Xero OAuth not configured' }, { status: 500 });
  }

  const scopes = 'openid profile email accounting.transactions accounting.contacts offline_access';
  const state = Buffer.from(JSON.stringify({ adminUid: auth.uid })).toString('base64');

  const url = new URL(XERO_AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scopes);
  url.searchParams.set('state', state);

  return NextResponse.json({ url: url.toString() });
}
