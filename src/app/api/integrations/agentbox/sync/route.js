import { NextResponse } from 'next/server';
import { getCredentials, fetchListings, mapListingToProperty, updateSyncStatus, syncContacts } from '../../../../api/services/agentboxService';
import { adminDb } from '../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // Get stored credentials
    const creds = await getCredentials(uid);
    if (!creds || creds.status !== 'connected') {
      return NextResponse.json({ error: 'Not connected to Agentbox' }, { status: 400 });
    }

    // Fetch current listings from Agentbox
    const data = await fetchListings(creds.clientId, creds.apiKey, { limit: 100 });
    const listings = data?.response?.listings || data?.listings || data?.response || [];
    const listingsArray = Array.isArray(listings) ? listings : [];

    // Get existing imported properties
    const propsSnapshot = await adminDb.collection('properties')
      .where('userId', '==', uid)
      .where('source', '==', 'agentbox')
      .get();

    const existingByListingId = {};
    propsSnapshot.docs.forEach((doc) => {
      const propData = doc.data();
      const listingId = propData.integrations?.agentbox?.listingId;
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

      if (!existing || !existing.integrations?.agentbox?.syncEnabled) continue;

      try {
        const mapped = mapListingToProperty(listing, uid);

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
          'integrations.agentbox.lastSynced': new Date(),
          'integrations.agentbox.originalData': listing,
          updatedAt: FieldValue.serverTimestamp(),
        });
        updated++;
      } catch (err) {
        console.error(`Error syncing listing ${listingId}:`, err);
        errors.push({ listingId, error: err.message });
      }
    }

    // Sync contacts silently alongside listings
    let contactResult = { synced: 0, total: 0, errors: [] };
    try {
      contactResult = await syncContacts(uid, creds.clientId, creds.apiKey);
    } catch (err) {
      console.error('Contact sync failed during manual sync:', err);
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
    console.error('Agentbox sync error:', err);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
