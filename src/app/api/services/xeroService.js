import { adminDb } from '../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export async function updateInvoiceInFirestore(invoiceData) {
  const invoiceId = invoiceData.InvoiceID || invoiceData.invoiceId;
  const newStatus = invoiceData.Status || invoiceData.status;
  const updatedTotal = invoiceData.Total || invoiceData.total;

  if (!invoiceId) throw new Error('Missing InvoiceID in payload');

  const userSnap = await adminDb
    .collection('users')
    .where('invoiceIds', 'array-contains', invoiceId)
    .get();

  if (userSnap.empty) {
    console.warn(`No user found for invoice ${invoiceId}`);
    return null;
  }

  const userDoc = userSnap.docs[0];
  const userRef = userDoc.ref;
  const userData = userDoc.data();
  const invoices = userData.invoices || [];

  const updatedInvoices = invoices.map((inv) =>
    inv.InvoiceID === invoiceId
      ? {
          ...inv,
          Status: newStatus || inv.Status,
          Total: updatedTotal || inv.Total,
          UpdatedAt: new Date().toISOString(),
        }
      : inv
  );

  await userRef.update({
    invoices: updatedInvoices,
    lastInvoiceSync: FieldValue.serverTimestamp(),
  });

  return userRef.id;
}
