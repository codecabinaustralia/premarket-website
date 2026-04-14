import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../middleware/auth';
import { adminDb } from '../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import { normalizeE164 } from '../../../utils/phone';

/**
 * GET /api/admin/users
 * List all users with property counts.
 */
export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [usersSnap, propertiesSnap] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('properties').get(),
    ]);

    // Count properties per user (only active, non-archived)
    const propertyCounts = {};
    let totalViews = 0;
    let totalActiveProperties = 0;
    for (const doc of propertiesSnap.docs) {
      const data = doc.data();
      if (data.active === false || data.archived === true) continue;
      const uid = data.userId || data.uid;
      if (uid) {
        propertyCounts[uid] = (propertyCounts[uid] || 0) + 1;
      }
      totalViews += data.stats?.views || 0;
      totalActiveProperties++;
    }

    const users = usersSnap.docs.map((doc) => {
      const data = doc.data();
      const ts = data.createdAt;
      if (doc.id === usersSnap.docs[0]?.id || doc.id === usersSnap.docs[1]?.id) {
        console.log('DEBUG createdAt', doc.id, typeof ts, ts, 'toMillis?', typeof ts?.toMillis, '_seconds?', ts?._seconds, 'seconds?', ts?.seconds);
      }
      const createdAtMs = ts?.toMillis?.() ?? ts?._seconds * 1000 ?? 0;
      return {
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        photoURL: data.photoURL || null,
        isAgent: data.isAgent || false,
        isBuyer: data.isBuyer || false,
        pro: data.pro || false,
        superAdmin: data.superAdmin || false,
        propertyCount: propertyCounts[doc.id] || 0,
        createdAt: data.createdAt || null,
        createdAtMs,
        apiAccess: data.apiAccess || null,
        unsubscribed: data.unsubscribed || false,
        smsPhone: data.smsPhone || null,
        smsEnabled: !!data.smsEnabled,
      };
    });

    // Sort newest first
    users.sort((a, b) => b.createdAtMs - a.createdAtMs);

    return NextResponse.json({
      users,
      totalProperties: totalActiveProperties,
      totalViews,
    });
  } catch (err) {
    console.error('Admin users GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Update user fields. Body: { targetUid, updates }
 */
export async function PATCH(request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { targetUid, updates } = await request.json();

    if (!targetUid || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      'pro',
      'superAdmin',
      'isAgent',
      'isBuyer',
      'marketReportOptIn',
      'unsubscribed',
      'smsPhone',
      'smsEnabled',
    ];
    const safeUpdates = {};
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Handle unsubscribed timestamp
    if ('unsubscribed' in safeUpdates) {
      if (safeUpdates.unsubscribed === true) {
        safeUpdates.unsubscribedAt = new Date();
      } else {
        safeUpdates.unsubscribedAt = FieldValue.delete();
      }
    }

    // Normalize SMS phone + enforce uniqueness across users and agents.
    if ('smsPhone' in safeUpdates) {
      const raw = safeUpdates.smsPhone;
      if (!raw) {
        safeUpdates.smsPhone = null;
        // If the phone is removed, SMS must also be disabled
        if (safeUpdates.smsEnabled !== false) safeUpdates.smsEnabled = false;
      } else {
        const normalized = normalizeE164(raw);
        if (!normalized) {
          return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }
        safeUpdates.smsPhone = normalized;

        // Check uniqueness (other users)
        const userDupe = await adminDb
          .collection('users')
          .where('smsPhone', '==', normalized)
          .limit(2)
          .get();
        const conflict = userDupe.docs.find((d) => d.id !== targetUid);
        if (conflict) {
          return NextResponse.json(
            { error: 'That number is already assigned to another user.' },
            { status: 409 }
          );
        }

        // Check uniqueness (agent sub-profiles)
        const agentDupe = await adminDb
          .collection('agents')
          .where('smsPhone', '==', normalized)
          .limit(1)
          .get();
        if (!agentDupe.empty) {
          return NextResponse.json(
            { error: 'That number is already assigned to a team member.' },
            { status: 409 }
          );
        }
      }
    }

    // Don't allow smsEnabled=true without a phone
    if (safeUpdates.smsEnabled === true && !safeUpdates.smsPhone) {
      const existing = await adminDb.collection('users').doc(targetUid).get();
      if (!existing.exists || !existing.data()?.smsPhone) {
        return NextResponse.json(
          { error: 'Cannot enable SMS without a phone number.' },
          { status: 400 }
        );
      }
    }

    await adminDb.collection('users').doc(targetUid).update(safeUpdates);

    return NextResponse.json({ success: true, updated: safeUpdates });
  } catch (err) {
    console.error('Admin users PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
