import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '../../../../middleware/auth';

/**
 * GET /api/admin/invoicing/runs/[runId]
 * Get full run details + all items.
 */
export async function GET(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { runId } = await params;

    const runDoc = await adminDb.collection('invoiceRuns').doc(runId).get();
    if (!runDoc.exists) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const itemsSnap = await adminDb
      .collection('invoiceRunItems')
      .where('runId', '==', runId)
      .get();

    const items = itemsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      run: { id: runDoc.id, ...runDoc.data() },
      items,
    });
  } catch (err) {
    console.error('Invoice run detail GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch run' }, { status: 500 });
  }
}

/**
 * Recalculate run totals from remaining items.
 */
async function recalculateRunTotals(runId, runRef) {
  const itemsSnap = await adminDb
    .collection('invoiceRunItems')
    .where('runId', '==', runId)
    .get();

  let totalProperties = 0;
  let totalAmountInc = 0;
  let totalAmountEx = 0;
  let totalGst = 0;

  for (const doc of itemsSnap.docs) {
    const item = doc.data();
    totalProperties += item.propertyCount || 0;
    totalAmountInc += item.totalInc || 0;
    totalAmountEx += item.subtotalEx || 0;
    totalGst += item.gstAmount || 0;
  }

  await runRef.update({
    totalProperties,
    totalAgencies: itemsSnap.size,
    totalAmountInc: Math.round(totalAmountInc * 100) / 100,
    totalAmountEx: Math.round(totalAmountEx * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
  });
}

/**
 * PATCH /api/admin/invoicing/runs/[runId]
 * Actions: approve, cancel, removeItems, removeProperties
 */
export async function PATCH(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { action } = body;
    const { runId } = await params;

    const runRef = adminDb.collection('invoiceRuns').doc(runId);
    const runDoc = await runRef.get();
    if (!runDoc.exists) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const currentStatus = runDoc.data().status;

    if (action === 'approve') {
      if (currentStatus !== 'draft') {
        return NextResponse.json({ error: 'Can only approve draft runs' }, { status: 400 });
      }
      await runRef.update({ status: 'approved', approvedAt: FieldValue.serverTimestamp(), approvedBy: auth.uid });
      return NextResponse.json({ success: true, status: 'approved' });
    }

    if (action === 'cancel') {
      if (!['draft', 'approved'].includes(currentStatus)) {
        return NextResponse.json({ error: 'Cannot cancel this run' }, { status: 400 });
      }
      await runRef.update({ status: 'cancelled', cancelledAt: FieldValue.serverTimestamp(), cancelledBy: auth.uid });
      return NextResponse.json({ success: true, status: 'cancelled' });
    }

    // Remove entire agency items from a draft run
    if (action === 'removeItems') {
      if (currentStatus !== 'draft') {
        return NextResponse.json({ error: 'Can only edit draft runs' }, { status: 400 });
      }
      const { itemIds } = body; // array of invoiceRunItem doc IDs
      if (!itemIds?.length) {
        return NextResponse.json({ error: 'No itemIds provided' }, { status: 400 });
      }

      const batch = adminDb.batch();
      for (const itemId of itemIds) {
        batch.delete(adminDb.collection('invoiceRunItems').doc(itemId));
      }
      await batch.commit();
      await recalculateRunTotals(runId, runRef);

      return NextResponse.json({ success: true, removed: itemIds.length });
    }

    // Remove individual properties from an agency item, recalculating its totals
    if (action === 'removeProperties') {
      if (currentStatus !== 'draft') {
        return NextResponse.json({ error: 'Can only edit draft runs' }, { status: 400 });
      }
      const { itemId, propertyIds } = body; // single item + array of propertyIds to remove
      if (!itemId || !propertyIds?.length) {
        return NextResponse.json({ error: 'Missing itemId or propertyIds' }, { status: 400 });
      }

      const itemRef = adminDb.collection('invoiceRunItems').doc(itemId);
      const itemDoc = await itemRef.get();
      if (!itemDoc.exists) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      const item = itemDoc.data();
      const remaining = (item.properties || []).filter((p) => !propertyIds.includes(p.propertyId));

      if (remaining.length === 0) {
        // All properties removed — delete the entire item
        await itemRef.delete();
      } else {
        // Recalculate item totals
        const gstRate = runDoc.data().gstRate || 0.1;
        const pricePerListing = item.pricePerListing || 200;
        const propertyCount = remaining.length;
        const subtotalEx = (pricePerListing / (1 + gstRate)) * propertyCount;
        const totalInc = pricePerListing * propertyCount;
        const gstAmount = totalInc - subtotalEx;

        await itemRef.update({
          properties: remaining,
          propertyCount,
          subtotalEx: Math.round(subtotalEx * 100) / 100,
          gstAmount: Math.round(gstAmount * 100) / 100,
          totalInc: Math.round(totalInc * 100) / 100,
        });
      }

      await recalculateRunTotals(runId, runRef);
      return NextResponse.json({ success: true, remainingProperties: remaining?.length ?? 0 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Invoice run PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update run' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/invoicing/runs/[runId]
 * Delete draft runs + their items.
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { runId } = await params;

    const runRef = adminDb.collection('invoiceRuns').doc(runId);
    const runDoc = await runRef.get();
    if (!runDoc.exists) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (runDoc.data().status !== 'draft') {
      return NextResponse.json({ error: 'Can only delete draft runs' }, { status: 400 });
    }

    // Delete all items for this run
    const itemsSnap = await adminDb
      .collection('invoiceRunItems')
      .where('runId', '==', runId)
      .get();

    const batch = adminDb.batch();
    for (const doc of itemsSnap.docs) {
      batch.delete(doc.ref);
    }
    batch.delete(runRef);
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Invoice run DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete run' }, { status: 500 });
  }
}
