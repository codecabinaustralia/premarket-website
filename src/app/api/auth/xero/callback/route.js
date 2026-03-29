import { NextResponse } from 'next/server';
import { adminDb } from '../../../../firebase/adminApp';
import { saveXeroTokens } from '../../../services/xeroService';

const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';

/**
 * GET /api/auth/xero/callback?code=xxx&state=xxx
 * Exchange authorization code for tokens, store in Firestore, redirect back.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/admin/invoicing?xero=error&reason=no_code', request.url));
    }

    // Verify state contains admin info
    let adminUid = null;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      adminUid = decoded.adminUid;
    } catch {
      // Continue without admin verification for the redirect
    }

    // Verify admin
    if (adminUid) {
      const adminDoc = await adminDb.collection('users').doc(adminUid).get();
      if (!adminDoc.exists || adminDoc.data().superAdmin !== true) {
        return NextResponse.redirect(new URL('/dashboard/admin/invoicing?xero=error&reason=unauthorized', request.url));
      }
    }

    // Exchange code for tokens
    const tokenRes = await fetch(XERO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.XERO_REDIRECT_URI,
        client_id: process.env.XERO_CLIENT_ID,
        client_secret: process.env.XERO_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Xero token exchange failed:', err);
      return NextResponse.redirect(new URL('/dashboard/admin/invoicing?xero=error&reason=token_exchange', request.url));
    }

    const tokens = await tokenRes.json();

    // Get tenant ID from connections endpoint
    const connectionsRes = await fetch(XERO_CONNECTIONS_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let tenantId = null;
    if (connectionsRes.ok) {
      const connections = await connectionsRes.json();
      if (connections.length > 0) {
        tenantId = connections[0].tenantId;
      }
    }

    // Store tokens
    await saveXeroTokens({ ...tokens, tenant_id: tenantId });

    return NextResponse.redirect(new URL('/dashboard/admin/invoicing?xero=connected', request.url));
  } catch (err) {
    console.error('Xero OAuth callback error:', err);
    return NextResponse.redirect(new URL('/dashboard/admin/invoicing?xero=error&reason=unknown', request.url));
  }
}
