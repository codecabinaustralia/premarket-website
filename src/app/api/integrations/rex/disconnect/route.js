import { NextResponse } from 'next/server';
import { removeCredentials, deleteContactsForAgent } from '../../../../api/services/rexService';
import { adminDb } from '../../../../firebase/adminApp';

export async function POST(request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // Verify user exists
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove credentials
    await removeCredentials(uid);

    // Mark all synced properties as disconnected (keep them but stop syncing)
    const propsSnapshot = await adminDb.collection('properties')
      .where('userId', '==', uid)
      .where('source', '==', 'rex')
      .get();

    const batch = adminDb.batch();
    propsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        'integrations.rex.syncEnabled': false,
      });
    });
    await batch.commit();

    // Delete synced contacts for this agent
    const deletedContacts = await deleteContactsForAgent(uid);

    return NextResponse.json({ success: true, deletedContacts });
  } catch (err) {
    console.error('Rex disconnect error:', err);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
