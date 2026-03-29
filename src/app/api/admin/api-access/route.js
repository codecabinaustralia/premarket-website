import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { adminDb } from '../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '../../middleware/auth';

/**
 * POST /api/admin/api-access
 * Actions: approve, revoke, regenerate, delete
 * Body: { targetUid, action }
 */
export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { targetUid, action } = await request.json();

    if (!targetUid || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const targetRef = adminDb.collection('users').doc(targetUid);
    const targetDoc = await targetRef.get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'approve': {
        const apiKey = generateApiKey();
        await targetRef.set(
          {
            apiAccess: {
              status: 'approved',
              apiKey,
              approvedAt: FieldValue.serverTimestamp(),
              revokedAt: null,
            },
          },
          { merge: true }
        );
        return NextResponse.json({ success: true, status: 'approved' });
      }

      case 'revoke': {
        await targetRef.set(
          {
            apiAccess: {
              status: 'revoked',
              apiKey: null,
              revokedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
        return NextResponse.json({ success: true, status: 'revoked' });
      }

      case 'regenerate': {
        const newKey = generateApiKey();
        await targetRef.set(
          {
            apiAccess: {
              status: 'approved',
              apiKey: newKey,
              approvedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
        return NextResponse.json({ success: true, status: 'approved' });
      }

      case 'delete': {
        await targetRef.set(
          {
            apiAccess: {
              status: 'none',
              apiKey: null,
              requestedAt: null,
              approvedAt: null,
              revokedAt: null,
            },
          },
          { merge: true }
        );
        return NextResponse.json({ success: true, status: 'none' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    console.error('Admin API access error:', err);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

function generateApiKey() {
  return `pm_${randomBytes(32).toString('hex')}`;
}
