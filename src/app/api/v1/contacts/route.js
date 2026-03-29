import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { adminDb } from '../../../firebase/adminApp';
import { validateApiKey } from '../middleware';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // agent, homeowner, buyer
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let q = adminDb.collection('contacts');

    // Filter by type
    if (type === 'agent') {
      q = q.where('isAgent', '==', true);
    } else if (type === 'homeowner') {
      q = q.where('isHomeowner', '==', true);
    } else if (type === 'buyer') {
      q = q.where('isBuyer', '==', true);
    }

    q = q.orderBy('lastActivityAt', 'desc');

    const snapshot = await q.get();
    let contacts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Client-side search filter (Firestore doesn't support text search)
    if (search) {
      const s = search.toLowerCase();
      contacts = contacts.filter((c) => {
        const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        return name.includes(s) || email.includes(s);
      });
    }

    const total = contacts.length;
    contacts = contacts.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      total,
      offset,
      limit,
      contacts,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'contacts' } });
    console.error('Contacts API error:', err);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}
