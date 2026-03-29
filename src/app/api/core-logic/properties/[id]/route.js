import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../middleware/auth';
import { getProperty } from '../../../services/coreLogicService';

export async function POST(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { corePropertyId } = await request.json();
    const { id: propertyId } = await params;
    const images = await getProperty(propertyId, corePropertyId);
    return NextResponse.json({ message: 'Images saved', corePropertyId, images });
  } catch (err) {
    console.error('CoreLogic error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
