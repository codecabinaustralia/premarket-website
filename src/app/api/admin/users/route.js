import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';

async function verifyAdmin(adminUid) {
  if (!adminUid) return false;
  const doc = await adminDb.collection('users').doc(adminUid).get();
  return doc.exists && doc.data().superAdmin === true;
}

/**
 * GET /api/admin/users?adminUid=xxx
 * List all users with property counts.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUid = searchParams.get('adminUid');

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
        apiAccess: data.apiAccess || null,
      };
    });

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
 * Update user fields. Body: { adminUid, targetUid, updates }
 */
export async function PATCH(request) {
  try {
    const { adminUid, targetUid, updates } = await request.json();

    if (!adminUid || !targetUid || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow specific fields to be updated
    const allowedFields = ['pro', 'superAdmin', 'isAgent', 'isBuyer'];
    const safeUpdates = {};
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await adminDb.collection('users').doc(targetUid).update(safeUpdates);

    return NextResponse.json({ success: true, updated: safeUpdates });
  } catch (err) {
    console.error('Admin users PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
