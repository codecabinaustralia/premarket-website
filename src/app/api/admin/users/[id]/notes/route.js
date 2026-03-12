import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

async function verifyAdmin(adminUid) {
  if (!adminUid) return false;
  const doc = await adminDb.collection('users').doc(adminUid).get();
  return doc.exists && doc.data().superAdmin === true;
}

/**
 * GET /api/admin/users/[id]/notes?adminUid=xxx
 * Get all admin notes for a user.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const adminUid = searchParams.get('adminUid');

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
 * Add a note. Body: { adminUid, text }
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { adminUid, text } = await request.json();

    if (!adminUid || !text?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get admin name for display
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    const adminData = adminDoc.data();
    const adminName = [adminData?.firstName, adminData?.lastName].filter(Boolean).join(' ') || 'Admin';

    const noteRef = await adminDb
      .collection('users')
      .doc(id)
      .collection('adminNotes')
      .add({
        text: text.trim(),
        createdBy: adminUid,
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
 * Delete a note. Body: { adminUid, noteId }
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { adminUid, noteId } = await request.json();

    if (!adminUid || !noteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!(await verifyAdmin(adminUid))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
