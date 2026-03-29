import { NextResponse } from 'next/server';
import { adminDb } from '../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

async function verifyAdmin(adminUid) {
  if (!adminUid) return false;
  const doc = await adminDb.collection('users').doc(adminUid).get();
  return doc.exists && doc.data().superAdmin === true;
}

/**
 * GET /api/admin/invoicing/runs?adminUid=xxx
 * List all invoice runs sorted by createdAt desc.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUid = searchParams.get('adminUid');

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const snap = await adminDb
      .collection('invoiceRuns')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const runs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ runs });
  } catch (err) {
    console.error('Invoice runs GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}

/**
 * POST /api/admin/invoicing/runs
 * Create a dry run for the previous calendar month.
 */
export async function POST(request) {
  try {
    const { adminUid, dateFrom, dateTo } = await request.json();

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get settings
    const settingsDoc = await adminDb.collection('settings').doc('invoicing').get();
    const settings = settingsDoc.exists
      ? settingsDoc.data()
      : { pricePerListing: 200, gstRate: 0.1 };

    const pricePerListing = settings.pricePerListing || 200;
    const gstRate = settings.gstRate || 0.1;
    const excludeAgentIds = settings.excludeAgentIds || [];

    // Use custom date range or default to previous calendar month
    let periodStart, periodEnd;
    if (dateFrom && dateTo) {
      periodStart = new Date(dateFrom);
      periodEnd = new Date(dateTo);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    // Query properties created within the billing period that haven't been invoiced
    const propertiesSnap = await adminDb
      .collection('properties')
      .where('createdAt', '>=', periodStart)
      .where('createdAt', '<=', periodEnd)
      .get();

    // Filter out already-invoiced, inactive, and excluded agent properties
    const billableProperties = [];
    for (const doc of propertiesSnap.docs) {
      const data = doc.data();
      if (data.active === false || data.archived === true) continue;
      if (data.invoicedRunIds && data.invoicedRunIds.length > 0) continue;
      const agentId = data.userId || data.uid;
      if (excludeAgentIds.includes(agentId)) continue;
      billableProperties.push({ id: doc.id, ...data });
    }

    // Fetch all unique agent user IDs
    const agentIds = [...new Set(billableProperties.map((p) => p.userId || p.uid).filter(Boolean))];

    // Batch-fetch agent user docs
    const agentMap = {};
    const batchSize = 10;
    for (let i = 0; i < agentIds.length; i += batchSize) {
      const batch = agentIds.slice(i, i + batchSize);
      const snap = await adminDb.collection('users').where('__name__', 'in', batch).get();
      for (const doc of snap.docs) {
        agentMap[doc.id] = doc.data();
      }
    }

    // Group properties by companyName (fallback to userId)
    const agencyGroups = {};
    for (const prop of billableProperties) {
      const agentId = prop.userId || prop.uid;
      const agent = agentMap[agentId] || {};
      const groupKey = agent.companyName || agentId || 'unknown';

      if (!agencyGroups[groupKey]) {
        agencyGroups[groupKey] = {
          agentUserId: agentId,
          agencyName: agent.companyName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'Unknown',
          agentName: `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'Unknown',
          agentEmail: agent.email || '',
          properties: [],
        };
      }
      agencyGroups[groupKey].properties.push({
        propertyId: prop.id,
        address: prop.address || prop.formattedAddress || 'No address',
        createdAt: prop.createdAt,
        price: prop.price || null,
      });
    }

    // Compute totals per agency
    const items = Object.values(agencyGroups).map((group) => {
      const propertyCount = group.properties.length;
      const subtotalEx = (pricePerListing / (1 + gstRate)) * propertyCount;
      const totalInc = pricePerListing * propertyCount;
      const gstAmount = totalInc - subtotalEx;

      return {
        ...group,
        propertyCount,
        pricePerListing,
        subtotalEx: Math.round(subtotalEx * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        totalInc: Math.round(totalInc * 100) / 100,
        status: 'pending',
        xeroContactId: null,
        xeroInvoiceId: null,
        xeroInvoiceNumber: null,
        xeroInvoiceUrl: null,
        xeroStatus: null,
        paidAt: null,
        lastSyncedAt: null,
      };
    });

    // Calculate run totals
    const totalProperties = items.reduce((sum, i) => sum + i.propertyCount, 0);
    const totalAmountInc = items.reduce((sum, i) => sum + i.totalInc, 0);
    const totalAmountEx = items.reduce((sum, i) => sum + i.subtotalEx, 0);
    const totalGst = items.reduce((sum, i) => sum + i.gstAmount, 0);

    // Get previous run for growth comparison
    const prevRunSnap = await adminDb
      .collection('invoiceRuns')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    const previousRun = prevRunSnap.empty ? null : prevRunSnap.docs[0];

    // Create the run document
    const runData = {
      status: 'draft',
      periodStart,
      periodEnd,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: adminUid,
      executedAt: null,
      pricePerListing,
      gstRate,
      totalProperties,
      totalAgencies: items.length,
      totalAmountInc: Math.round(totalAmountInc * 100) / 100,
      totalAmountEx: Math.round(totalAmountEx * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      previousRunId: previousRun?.id || null,
      previousTotalProperties: previousRun?.data()?.totalProperties || 0,
      previousTotalAmountInc: previousRun?.data()?.totalAmountInc || 0,
      errors: [],
      xeroSendResults: [],
    };

    const runRef = await adminDb.collection('invoiceRuns').add(runData);

    // Create item documents
    const batch = adminDb.batch();
    for (const item of items) {
      const itemRef = adminDb.collection('invoiceRunItems').doc();
      batch.set(itemRef, { ...item, runId: runRef.id });
    }
    await batch.commit();

    return NextResponse.json({
      success: true,
      runId: runRef.id,
      summary: {
        totalProperties,
        totalAgencies: items.length,
        totalAmountInc: runData.totalAmountInc,
        totalAmountEx: runData.totalAmountEx,
        totalGst: runData.totalGst,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
    });
  } catch (err) {
    console.error('Invoice runs POST error:', err);
    return NextResponse.json({ error: 'Failed to create dry run' }, { status: 500 });
  }
}
