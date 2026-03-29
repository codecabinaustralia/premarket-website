import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import { batchGetInvoiceStatuses, isXeroConnected } from '../../../../../services/xeroService';

async function verifyAdmin(adminUid) {
  if (!adminUid) return false;
  const doc = await adminDb.collection('users').doc(adminUid).get();
  return doc.exists && doc.data().superAdmin === true;
}

/**
 * POST /api/admin/invoicing/runs/[runId]/sync
 * Batch fetch invoice statuses from Xero and update items.
 */
export async function POST(request, { params }) {
  try {
    const { adminUid } = await request.json();
    const { runId } = await params;

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!(await isXeroConnected())) {
      return NextResponse.json({ error: 'Xero is not connected' }, { status: 400 });
    }

    // Get all items with Xero invoice IDs
    const itemsSnap = await adminDb
      .collection('invoiceRunItems')
      .where('runId', '==', runId)
      .get();

    const itemsWithXero = itemsSnap.docs.filter((d) => d.data().xeroInvoiceId);
    if (itemsWithXero.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: 'No Xero invoices to sync' });
    }

    // Batch fetch statuses from Xero
    const xeroIds = itemsWithXero.map((d) => d.data().xeroInvoiceId);
    const xeroInvoices = await batchGetInvoiceStatuses(xeroIds);

    // Build lookup by InvoiceID
    const statusMap = {};
    for (const inv of xeroInvoices) {
      statusMap[inv.InvoiceID] = inv;
    }

    // Update each item
    let synced = 0;
    let paidCount = 0;

    for (const itemDoc of itemsWithXero) {
      const item = itemDoc.data();
      const xeroInvoice = statusMap[item.xeroInvoiceId];
      if (!xeroInvoice) continue;

      const updates = {
        xeroStatus: xeroInvoice.Status,
        lastSyncedAt: FieldValue.serverTimestamp(),
      };

      if (xeroInvoice.Status === 'PAID') {
        updates.paidAt = xeroInvoice.FullyPaidOnDate || new Date().toISOString();
        updates.status = 'paid';
        paidCount++;
      } else if (xeroInvoice.Status === 'VOIDED') {
        updates.status = 'voided';
      }

      await itemDoc.ref.update(updates);
      synced++;
    }

    return NextResponse.json({
      success: true,
      synced,
      paidCount,
      total: itemsWithXero.length,
    });
  } catch (err) {
    console.error('Invoice run sync error:', err);
    return NextResponse.json({ error: 'Failed to sync invoices' }, { status: 500 });
  }
}
