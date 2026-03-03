import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/admin/api-access
 * Actions: approve, revoke, regenerate, delete
 * Body: { adminUid, targetUid, action }
 */
export async function POST(request) {
  try {
    const { adminUid, targetUid, action } = await request.json();

    if (!adminUid || !targetUid || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify admin is superAdmin
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data().superAdmin !== true) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
  // Generate a UUID v4-style API key with a prefix
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(
      Math.random().toString(16).substring(2, 10)
    );
  }
  return `pm_${segments.join('')}`;
}
