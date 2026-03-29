import { NextResponse } from 'next/server';
import { adminDb } from '../../../../firebase/adminApp';

async function verifyAdmin(adminUid) {
  if (!adminUid) return false;
  const doc = await adminDb.collection('users').doc(adminUid).get();
  return doc.exists && doc.data().superAdmin === true;
}

const DEFAULT_SETTINGS = {
  pricePerListing: 200,
  gstRate: 0.1,
  paymentTermsDays: 14,
  invoicePrefix: 'PM-',
  xeroAccountCode: '200',
  cronDay: 1,
  cronEnabled: false,
  excludeAgentIds: [],
  marketReportRecipients: [],
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUid = searchParams.get('adminUid');

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [settingsDoc, xeroDoc] = await Promise.all([
      adminDb.collection('settings').doc('invoicing').get(),
      adminDb.collection('settings').doc('xeroTokens').get(),
    ]);
    const settings = settingsDoc.exists ? { ...DEFAULT_SETTINGS, ...settingsDoc.data() } : DEFAULT_SETTINGS;

    // Include xero connection status
    settings.xeroConnected = !!(xeroDoc.exists && xeroDoc.data()?.refresh_token);

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('Invoicing settings GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { adminUid, settings } = body;

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const allowedFields = [
      'pricePerListing', 'gstRate', 'paymentTermsDays', 'invoicePrefix',
      'xeroAccountCode', 'cronDay', 'cronEnabled', 'excludeAgentIds',
      'marketReportRecipients',
    ];

    const safeSettings = {};
    for (const key of allowedFields) {
      if (key in settings) {
        safeSettings[key] = settings[key];
      }
    }

    await adminDb.collection('settings').doc('invoicing').set(safeSettings, { merge: true });

    return NextResponse.json({ success: true, settings: safeSettings });
  } catch (err) {
    console.error('Invoicing settings PUT error:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
