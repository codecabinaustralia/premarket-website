import { NextResponse } from 'next/server';
import { fetchListings, getCredentials } from '../../../../api/services/agentboxService';
import { DEMO_LISTINGS } from '../../../../api/services/agentboxDemoData';
import { adminDb } from '../../../../firebase/adminApp';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // Get stored credentials
    const creds = await getCredentials(uid);
    if (!creds || creds.status !== 'connected') {
      return NextResponse.json({ error: 'Not connected to Agentbox' }, { status: 400 });
    }

    // Check which listings are already imported
    const propsSnapshot = await adminDb.collection('properties')
      .where('userId', '==', uid)
      .where('source', '==', 'agentbox')
      .get();

    const importedListingIds = new Set();
    const importedProperties = {};
    propsSnapshot.docs.forEach((doc) => {
      const propData = doc.data();
      const listingId = propData.integrations?.agentbox?.listingId;
      if (listingId) {
        importedListingIds.add(listingId);
        importedProperties[listingId] = {
          propertyId: doc.id,
          visibility: propData.visibility,
          syncEnabled: propData.integrations?.agentbox?.syncEnabled,
        };
      }
    });

    let listings;

    if (creds.mode === 'demo') {
      // Demo mode — return test data
      listings = DEMO_LISTINGS;
    } else {
      // Real mode — fetch from Agentbox API
      const data = await fetchListings(creds.clientId, creds.apiKey, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      const raw = data?.response?.listings || data?.listings || data?.response || [];
      listings = Array.isArray(raw) ? raw : [];
    }

    // Annotate listings with import status
    const annotatedListings = listings.map((listing) => ({
      ...listing,
      _imported: importedListingIds.has(String(listing.id)),
      _premarket: importedProperties[String(listing.id)] || null,
    }));

    return NextResponse.json({
      listings: annotatedListings,
      pagination: { page: parseInt(page), total: annotatedListings.length },
    });
  } catch (err) {
    console.error('Agentbox listings error:', err);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
