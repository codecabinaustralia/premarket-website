import { NextResponse } from 'next/server';
import { adminDb } from '../../../../firebase/adminApp';

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    const doc = await adminDb.collection('docLinks').doc(token).get();

    if (!doc.exists || doc.data().active !== true) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error('Validate doc link error:', err);
    return NextResponse.json({ valid: false });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { token } = await params;
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const adminDoc = await adminDb.collection('users').doc(uid).get();
    if (!adminDoc.exists || adminDoc.data().superAdmin !== true) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await adminDb.collection('docLinks').doc(token).update({ active: false });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Deactivate doc link error:', err);
    return NextResponse.json({ error: 'Failed to deactivate link' }, { status: 500 });
  }
}
