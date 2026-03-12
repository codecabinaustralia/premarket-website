import { NextResponse } from 'next/server';
import { getCredentials, fetchListingById, mapListingToProperty } from '../../../../api/services/agentboxService';
import { DEMO_LISTINGS } from '../../../../api/services/agentboxDemoData';
import { adminDb } from '../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const { uid, listingIds } = await request.json();

    if (!uid || !listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json({ error: 'Missing uid or listingIds' }, { status: 400 });
    }

    if (listingIds.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 listings per import' }, { status: 400 });
    }

    // Get stored credentials
    const creds = await getCredentials(uid);
    if (!creds || creds.status !== 'connected') {
      return NextResponse.json({ error: 'Not connected to Agentbox' }, { status: 400 });
    }

    const isDemo = creds.mode === 'demo';

    // Index demo listings by id for quick lookup
    const demoListingsMap = {};
    if (isDemo) {
      for (const dl of DEMO_LISTINGS) {
        demoListingsMap[String(dl.id)] = dl;
      }
    }

    // Check which listings are already imported
    const existingSnapshot = await adminDb.collection('properties')
      .where('userId', '==', uid)
      .where('source', '==', 'agentbox')
      .get();

    const existingListingIds = new Set();
    existingSnapshot.docs.forEach((doc) => {
      const listingId = doc.data().integrations?.agentbox?.listingId;
      if (listingId) existingListingIds.add(listingId);
    });

    const results = [];
    const errors = [];

    for (const listingId of listingIds) {
      try {
        // Skip already imported
        if (existingListingIds.has(String(listingId))) {
          results.push({ listingId, status: 'skipped', reason: 'Already imported' });
          continue;
        }

        let listing;

        if (isDemo) {
          // Use demo data directly
          listing = demoListingsMap[String(listingId)];
        } else {
          // Fetch full listing detail from AgentBox API
          const listingData = await fetchListingById(creds.clientId, creds.apiKey, listingId);
          listing = listingData?.response?.listing || listingData?.response || listingData;
        }

        if (!listing) {
          errors.push({ listingId, error: 'Listing not found' });
          continue;
        }

        // Map to Premarket property
        const propertyData = mapListingToProperty(listing, uid);

        // Create the property document
        const docRef = await adminDb.collection('properties').add(propertyData);

        // Create draft backup
        await adminDb.collection('draftProperties').doc(docRef.id).set({
          ...propertyData,
          override: true,
          createdAt: FieldValue.serverTimestamp(),
        });

        results.push({
          listingId,
          status: 'imported',
          propertyId: docRef.id,
        });
      } catch (err) {
        console.error(`Error importing listing ${listingId}:`, err);
        errors.push({ listingId, error: err.message });
      }
    }

    // Update sync status
    await adminDb.collection('users').doc(uid).update({
      'integrations.agentbox.lastSync': FieldValue.serverTimestamp(),
      'integrations.agentbox.lastSyncStatus': errors.length === 0 ? 'success' : 'partial',
    });

    return NextResponse.json({
      success: true,
      imported: results.filter(r => r.status === 'imported').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: errors.length,
      results,
      errorDetails: errors,
    });
  } catch (err) {
    console.error('Agentbox import error:', err);
    return NextResponse.json({ error: 'Failed to import listings' }, { status: 500 });
  }
}
