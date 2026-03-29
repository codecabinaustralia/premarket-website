import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '../../services/resendService';

export const maxDuration = 120;

/**
 * GET /api/cron/invoice-dry-run
 * Runs daily. On the configured cronDay, creates a dry run for the previous month
 * and sends a notification email to superAdmins.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check settings
    const settingsDoc = await adminDb.collection('settings').doc('invoicing').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};

    if (!settings.cronEnabled) {
      return NextResponse.json({ message: 'Cron disabled', skipped: true });
    }

    const today = new Date();
    const cronDay = settings.cronDay || 1;

    if (today.getDate() !== cronDay) {
      return NextResponse.json({ message: `Not cron day (today=${today.getDate()}, configured=${cronDay})`, skipped: true });
    }

    // Create dry run for previous calendar month
    const pricePerListing = settings.pricePerListing || 200;
    const gstRate = settings.gstRate || 0.1;
    const excludeAgentIds = settings.excludeAgentIds || [];

    const periodStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    // Check for existing run this period
    const existingSnap = await adminDb
      .collection('invoiceRuns')
      .where('periodStart', '>=', periodStart)
      .where('periodStart', '<=', periodEnd)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json({ message: 'Run already exists for this period', skipped: true });
    }

    // Query billable properties
    const propertiesSnap = await adminDb
      .collection('properties')
      .where('createdAt', '>=', periodStart)
      .where('createdAt', '<=', periodEnd)
      .get();

    const billableProperties = [];
    for (const doc of propertiesSnap.docs) {
      const data = doc.data();
      if (data.active === false || data.archived === true) continue;
      if (data.invoicedRunIds && data.invoicedRunIds.length > 0) continue;
      const agentId = data.userId || data.uid;
      if (excludeAgentIds.includes(agentId)) continue;
      billableProperties.push({ id: doc.id, ...data });
    }

    // Fetch agents and group by company
    const agentIds = [...new Set(billableProperties.map((p) => p.userId || p.uid).filter(Boolean))];
    const agentMap = {};
    const batchSize = 10;
    for (let i = 0; i < agentIds.length; i += batchSize) {
      const batch = agentIds.slice(i, i + batchSize);
      const snap = await adminDb.collection('users').where('__name__', 'in', batch).get();
      for (const doc of snap.docs) {
        agentMap[doc.id] = doc.data();
      }
    }

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

    const totalProperties = items.reduce((sum, i) => sum + i.propertyCount, 0);
    const totalAmountInc = items.reduce((sum, i) => sum + i.totalInc, 0);
    const totalAmountEx = items.reduce((sum, i) => sum + i.subtotalEx, 0);
    const totalGst = items.reduce((sum, i) => sum + i.gstAmount, 0);

    // Get previous run
    const prevRunSnap = await adminDb
      .collection('invoiceRuns')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    const previousRun = prevRunSnap.empty ? null : prevRunSnap.docs[0];

    // Create run
    const runData = {
      status: 'draft',
      periodStart,
      periodEnd,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: 'cron',
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

    const writeBatch = adminDb.batch();
    for (const item of items) {
      const itemRef = adminDb.collection('invoiceRunItems').doc();
      writeBatch.set(itemRef, { ...item, runId: runRef.id });
    }
    await writeBatch.commit();

    // Notify superAdmins
    const adminsSnap = await adminDb.collection('users').where('superAdmin', '==', true).get();
    const periodStr = periodStart.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

    for (const adminDoc of adminsSnap.docs) {
      const adminData = adminDoc.data();
      if (adminData.email) {
        await sendEmail({
          to: adminData.email,
          subject: `Invoice Dry Run Ready: ${periodStr}`,
          html: `
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Monthly Invoice Dry Run</h2>
              <p>A new invoice dry run has been created for <strong>${periodStr}</strong>.</p>
              <ul>
                <li>Properties: ${totalProperties}</li>
                <li>Agencies: ${items.length}</li>
                <li>Total (inc GST): $${Math.round(totalAmountInc).toLocaleString()}</li>
              </ul>
              <p><a href="https://premarket.homes/dashboard/admin/invoicing">Review in Admin Dashboard</a></p>
            </body>
          `,
        });
      }
    }

    return NextResponse.json({
      success: true,
      runId: runRef.id,
      totalProperties,
      totalAgencies: items.length,
      totalAmountInc: Math.round(totalAmountInc * 100) / 100,
    });
  } catch (err) {
    console.error('Invoice dry run cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
