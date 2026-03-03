import { NextResponse } from 'next/server';
import { gatherReport } from '../services/reportService';

export async function POST(request) {
  try {
    const { email, propertyId } = await request.json();
    if (!email || !propertyId) {
      return NextResponse.json({ error: 'Missing email or propertyId' }, { status: 400 });
    }

    await gatherReport(email, propertyId);
    return NextResponse.json({ success: true, message: 'Report sent successfully' });
  } catch (err) {
    console.error('Error sending report:', err);
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 });
  }
}
