import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../api/middleware/auth';
import { getCredentials, fetchListings, mapRexListingToProperty, updateSyncStatus, syncContacts } from '../../../../api/services/rexService';
import { DEMO_LISTINGS } from '../../../../api/services/rexDemoData';
import { adminDb } from '../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const uid = auth.uid;

    // Get stored credentials
    const creds = await getCredentials(uid);
    if (!creds || creds.status !== 'connected') {
      return NextResponse.json({ error: 'Not connected to Rex' }, { status: 400 });
    }

    const isDemo = creds.mode === 'demo';

    // Fetch current listings — demo data or real API
    let listingsArray;
    if (isDemo) {
      listingsArray = DEMO_LISTINGS;
    } else {
      const data = await fetchListings(creds.accessToken, { limit: 100 });
      const listings = data?.result?.rows || data?.result || data?.response?.listings || data?.listings || [];
      listingsArray = Array.isArray(listings) ? listings : [];
    }

    // Get existing imported properties
    const propsSnapshot = await adminDb.collection('properties')
      .where('userId', '==', uid)
      .where('source', '==', 'rex')
      .get();

    const existingByListingId = {};
    propsSnapshot.docs.forEach((doc) => {
      const propData = doc.data();
      const listingId = propData.integrations?.rex?.listingId;
      if (listingId) {
        existingByListingId[listingId] = { id: doc.id, ...propData };
      }
    });

    let updated = 0;
    const errors = [];

    // Update existing imported properties with fresh data
    for (const listing of listingsArray) {
      const listingId = String(listing.id);
      const existing = existingByListingId[listingId];

      if (!existing || !existing.integrations?.rex?.syncEnabled) continue;

      try {
        const mapped = mapRexListingToProperty(listing, uid);

        // Only update certain fields, preserve Premarket-specific data
        await adminDb.collection('properties').doc(existing.id).update({
          formattedAddress: mapped.formattedAddress,
          address: mapped.address,
          location: mapped.location,
          price: mapped.price,
          bedrooms: mapped.bedrooms,
          bathrooms: mapped.bathrooms,
          carSpaces: mapped.carSpaces,
          squareFootage: mapped.squareFootage,
          title: mapped.title,
          description: mapped.description,
          imageUrls: mapped.imageUrls,
          features: mapped.features,
          'integrations.rex.lastSynced': new Date(),
          'integrations.rex.originalData': listing,
          updatedAt: FieldValue.serverTimestamp(),
        });
        updated++;
      } catch (err) {
        console.error(`Error syncing Rex listing ${listingId}:`, err);
        errors.push({ listingId, error: err.message });
      }
    }

    // Sync contacts silently alongside listings (skip for demo)
    let contactResult = { synced: 0, total: 0, errors: [] };
    if (!isDemo) {
      try {
        contactResult = await syncContacts(uid, creds.accessToken);
      } catch (err) {
        console.error('Rex contact sync failed during manual sync:', err);
      }
    }

    await updateSyncStatus(uid, errors.length === 0 ? 'success' : 'partial', errors);

    return NextResponse.json({
      success: true,
      updated,
      totalListings: listingsArray.length,
      errors: errors.length,
      contactsSynced: contactResult.synced,
    });
  } catch (err) {
    console.error('Rex sync error:', err);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
