import { NextResponse } from 'next/server';
import { adminDb } from '../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '../../../middleware/auth';

/**
 * POST /api/admin/invoicing/agency-invoice
 * Create a manual invoice run for a specific agency with selected agents/properties.
 *
 * Body: { agencyName, agentIds, propertyIds? }
 * - agentIds: array of agent user IDs (required)
 * - propertyIds: optional array of specific property IDs (if omitted, uses all active properties for agents)
 * - agencyName: optional display name for the invoice
 */
export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { agencyName, agentIds, propertyIds } = await request.json();

    if (!agentIds?.length) {
      return NextResponse.json({ error: 'At least one agent required' }, { status: 400 });
    }

    // Fetch invoicing settings
    const settingsDoc = await adminDb.collection('settings').doc('invoicing').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    const pricePerListing = settings.pricePerListing || 200;
    const gstRate = settings.gstRate || 0.1;

    // Count billable properties for these agents
    let billableProperties = [];

    if (propertyIds?.length > 0) {
      // Use specified properties
      for (const propId of propertyIds) {
        const propDoc = await adminDb.collection('properties').doc(propId).get();
        if (propDoc.exists) {
          const data = propDoc.data();
          billableProperties.push({ id: propDoc.id, ...data });
        }
      }
    } else {
      // Find all active properties for these agents
      const uniqueAgentIds = [...new Set(agentIds)];
      for (const agentId of uniqueAgentIds) {
        const propsSnap = await adminDb.collection('properties')
          .where('userId', '==', agentId)
          .get();

        propsSnap.docs.forEach(d => {
          const data = d.data();
          if (data.active !== false && data.archived !== true && data.visibility === true) {
            billableProperties.push({ id: d.id, ...data });
          }
        });

        // Also check uid field
        const propsSnap2 = await adminDb.collection('properties')
          .where('uid', '==', agentId)
          .get();

        const existingIds = new Set(billableProperties.map(p => p.id));
        propsSnap2.docs.forEach(d => {
          if (existingIds.has(d.id)) return;
          const data = d.data();
          if (data.active !== false && data.archived !== true && data.visibility === true) {
            billableProperties.push({ id: d.id, ...data });
          }
        });
      }
    }

    const propertyCount = billableProperties.length;

    if (propertyCount === 0) {
      return NextResponse.json({ error: 'No billable properties found for selected agents' }, { status: 400 });
    }

    // Calculate amounts (price includes GST, need to extract GST component)
    const totalInc = pricePerListing * propertyCount;
    const subtotalEx = totalInc / (1 + gstRate);
    const gst = totalInc - subtotalEx;

    // Fetch agent details for the invoice item
    const agentMap = {};
    const batchSize = 10;
    for (let i = 0; i < agentIds.length; i += batchSize) {
      const batch = agentIds.slice(i, i + batchSize);
      const snap = await adminDb.collection('users').where('__name__', 'in', batch).get();
      for (const doc of snap.docs) {
        agentMap[doc.id] = doc.data();
      }
    }

    // Get first agent for invoice metadata
    const firstAgent = agentMap[agentIds[0]] || {};
    const displayAgencyName = agencyName || firstAgent.companyName || 'Manual Agency Invoice';

    // Create invoice run
    const runData = {
      type: 'agency',
      status: 'draft',
      agencyName: displayAgencyName,
      agentIds: [...new Set(agentIds)],
      propertyIds: billableProperties.map(p => p.id),
      periodStart: null, // Manual invoice, no period
      periodEnd: null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: auth.uid,
      executedAt: null,
      pricePerListing,
      gstRate,
      totalProperties: propertyCount,
      totalAgencies: 1,
      totalAmountInc: Math.round(totalInc * 100) / 100,
      totalAmountEx: Math.round(subtotalEx * 100) / 100,
      totalGst: Math.round(gst * 100) / 100,
      previousRunId: null,
      previousTotalProperties: 0,
      previousTotalAmountInc: 0,
      errors: [],
      xeroSendResults: [],
    };

    const runRef = await adminDb.collection('invoiceRuns').add(runData);

    // Create single invoice item for this agency
    const itemData = {
      runId: runRef.id,
      agencyName: displayAgencyName,
      agentIds: [...new Set(agentIds)],
      agentUserId: agentIds[0], // Primary agent for Xero contact lookup
      agentName: `${firstAgent.firstName || ''} ${firstAgent.lastName || ''}`.trim() || 'Unknown',
      agentEmail: firstAgent.email || '',
      properties: billableProperties.map(p => ({
        propertyId: p.id,
        address: p.address || p.formattedAddress || 'Unknown',
        createdAt: p.createdAt,
        price: p.price || null,
      })),
      propertyCount,
      pricePerListing,
      subtotalEx: Math.round(subtotalEx * 100) / 100,
      gstAmount: Math.round(gst * 100) / 100,
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

    await adminDb.collection('invoiceRunItems').add(itemData);

    return NextResponse.json({
      success: true,
      runId: runRef.id,
      propertyCount,
      subtotalEx: runData.totalAmountEx,
      gst: runData.totalGst,
      total: runData.totalAmountInc,
    });
  } catch (err) {
    console.error('Agency invoice error:', err);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
