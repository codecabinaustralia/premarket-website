import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../firebase/adminApp';
import { getAuth } from 'firebase-admin/auth';
import { verifyAdmin } from '../../../../middleware/auth';

export async function POST(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Fetch user
    const userDoc = await adminDb.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Safety: prevent deleting superAdmin
    if (userData.superAdmin === true) {
      return NextResponse.json({ error: 'Cannot delete superAdmin users' }, { status: 403 });
    }

    const deleted = { properties: 0, offers: 0, likes: 0, contacts: 0, scores: 0 };

    // 1. Find user's properties
    const propsSnap1 = await adminDb.collection('properties').where('userId', '==', id).get();
    const propsSnap2 = await adminDb.collection('properties').where('uid', '==', id).get();
    const propertyIds = new Set();
    [...propsSnap1.docs, ...propsSnap2.docs].forEach(d => propertyIds.add(d.id));

    // 2. For each property, delete related data
    for (const propertyId of propertyIds) {
      // Delete offers for this property
      const offersSnap = await adminDb.collection('offers').where('propertyId', '==', propertyId).get();
      const offerBatch = adminDb.batch();
      offersSnap.docs.forEach(d => { offerBatch.delete(d.ref); deleted.offers++; });
      if (offersSnap.docs.length > 0) await offerBatch.commit();

      // Delete likes for this property
      const likesSnap = await adminDb.collection('likes').where('propertyId', '==', propertyId).get();
      const likesBatch = adminDb.batch();
      likesSnap.docs.forEach(d => { likesBatch.delete(d.ref); deleted.likes++; });
      if (likesSnap.docs.length > 0) await likesBatch.commit();

      // Delete propertyScores
      try {
        await adminDb.collection('propertyScores').doc(propertyId).delete();
        deleted.scores++;
      } catch (e) { /* may not exist */ }

      // Delete propertyEngagement
      const engSnap = await adminDb.collection('propertyEngagement').where('propertyId', '==', propertyId).get();
      const engBatch = adminDb.batch();
      engSnap.docs.forEach(d => engBatch.delete(d.ref));
      if (engSnap.docs.length > 0) await engBatch.commit();

      // Delete the property
      await adminDb.collection('properties').doc(propertyId).delete();
      deleted.properties++;
    }

    // 3. Delete user's offers as buyer (by email)
    if (userData.email) {
      const buyerOffersSnap = await adminDb.collection('offers').where('email', '==', userData.email).get();
      const buyerBatch = adminDb.batch();
      buyerOffersSnap.docs.forEach(d => { buyerBatch.delete(d.ref); deleted.offers++; });
      if (buyerOffersSnap.docs.length > 0) await buyerBatch.commit();
    }

    // 4. Delete user's likes
    const userLikesSnap = await adminDb.collection('likes').where('userId', '==', id).get();
    const userLikesBatch = adminDb.batch();
    userLikesSnap.docs.forEach(d => { userLikesBatch.delete(d.ref); deleted.likes++; });
    if (userLikesSnap.docs.length > 0) await userLikesBatch.commit();

    // 5. Delete adminNotes subcollection
    const notesSnap = await adminDb.collection('users').doc(id).collection('adminNotes').get();
    const notesBatch = adminDb.batch();
    notesSnap.docs.forEach(d => notesBatch.delete(d.ref));
    if (notesSnap.docs.length > 0) await notesBatch.commit();

    // 6. Delete contacts doc
    try {
      const contactsSnap = await adminDb.collection('contacts').where('userId', '==', id).get();
      const contactsBatch = adminDb.batch();
      contactsSnap.docs.forEach(d => { contactsBatch.delete(d.ref); deleted.contacts++; });
      if (contactsSnap.docs.length > 0) await contactsBatch.commit();
    } catch (e) { /* may not exist */ }

    // 7. Delete user doc from Firestore
    await adminDb.collection('users').doc(id).delete();

    // 8. Delete Firebase Auth user
    try {
      await getAuth().deleteUser(id);
    } catch (e) {
      console.warn('Could not delete auth user (may not exist):', e.message);
    }

    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    console.error('Cascade delete error:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
