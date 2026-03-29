import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../middleware/auth';
import { adminDb } from '../../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/admin/users/[id]/notes
 * Get all admin notes for a user.
 */
export async function GET(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const snapshot = await adminDb
      .collection('users')
      .doc(id)
      .collection('adminNotes')
      .orderBy('createdAt', 'desc')
      .get();

    const notes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ notes });
  } catch (err) {
    console.error('Admin notes GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users/[id]/notes
 * Add a note. Body: { text }
 */
export async function POST(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get admin name for display
    const adminDoc = await adminDb.collection('users').doc(auth.uid).get();
    const adminData = adminDoc.data();
    const adminName = [adminData?.firstName, adminData?.lastName].filter(Boolean).join(' ') || 'Admin';

    const noteRef = await adminDb
      .collection('users')
      .doc(id)
      .collection('adminNotes')
      .add({
        text: text.trim(),
        createdBy: auth.uid,
        createdByName: adminName,
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ success: true, noteId: noteRef.id });
  } catch (err) {
    console.error('Admin notes POST error:', err);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]/notes
 * Delete a note. Body: { noteId }
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const { noteId } = await request.json();

    if (!noteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await adminDb
      .collection('users')
      .doc(id)
      .collection('adminNotes')
      .doc(noteId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin notes DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
