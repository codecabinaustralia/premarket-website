import { NextResponse } from 'next/server';
import { getProperty } from '../../../services/coreLogicService';

export async function POST(request, { params }) {
  try {
    const { corePropertyId } = await request.json();
    const { id: propertyId } = await params;
    const images = await getProperty(propertyId, corePropertyId);
    return NextResponse.json({ message: 'Images saved', corePropertyId, images });
  } catch (err) {
    console.error('CoreLogic error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
