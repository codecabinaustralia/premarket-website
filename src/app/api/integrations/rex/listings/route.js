import { NextResponse } from 'next/server';
import { fetchListings, getCredentials } from '../../../../api/services/rexService';
import { DEMO_LISTINGS } from '../../../../api/services/rexDemoData';
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
      return NextResponse.json({ error: 'Not connected to Rex' }, { status: 400 });
    }

    // Check which listings are already imported
    const propsSnapshot = await adminDb.collection('properties')
      .where('userId', '==', uid)
      .where('source', '==', 'rex')
      .get();

    const importedListingIds = new Set();
    const importedProperties = {};
    propsSnapshot.docs.forEach((doc) => {
      const propData = doc.data();
      const listingId = propData.integrations?.rex?.listingId;
      if (listingId) {
        importedListingIds.add(listingId);
        importedProperties[listingId] = {
          propertyId: doc.id,
          visibility: propData.visibility,
          syncEnabled: propData.integrations?.rex?.syncEnabled,
        };
      }
    });

    let listings;

    if (creds.mode === 'demo') {
      // Demo mode — return test data
      listings = DEMO_LISTINGS;
    } else {
      // Real mode — fetch from Rex API
      const data = await fetchListings(creds.accessToken, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      const raw = data?.result?.rows || data?.result || data?.response?.listings || data?.listings || [];
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
    console.error('Rex listings error:', err);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
