import { NextResponse } from 'next/server';
import { adminDb } from '../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

async function verifyAdmin(adminUid) {
  if (!adminUid) return false;
  const doc = await adminDb.collection('users').doc(adminUid).get();
  return doc.exists && doc.data().superAdmin === true;
}

export async function POST(request) {
  try {
    const { adminUid, action, userIds } = await request.json();

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No users specified' }, { status: 400 });
    }

    if (userIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 users per batch' }, { status: 400 });
    }

    const validActions = ['subscribe', 'unsubscribe'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Valid: ${validActions.join(', ')}` }, { status: 400 });
    }

    let updated = 0;

    // Process in batches of 500 (Firestore limit)
    for (let i = 0; i < userIds.length; i += 500) {
      const batch = adminDb.batch();
      const chunk = userIds.slice(i, i + 500);

      for (const uid of chunk) {
        const ref = adminDb.collection('users').doc(uid);
        if (action === 'subscribe') {
          batch.update(ref, { unsubscribed: false, unsubscribedAt: FieldValue.delete() });
        } else if (action === 'unsubscribe') {
          batch.update(ref, { unsubscribed: true, unsubscribedAt: new Date() });
        }
        updated++;
      }

      await batch.commit();
    }

    return NextResponse.json({ success: true, action, updated });
  } catch (err) {
    console.error('Bulk action error:', err);
    return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 });
  }
}
