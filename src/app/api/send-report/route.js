import { NextResponse } from 'next/server';
import { verifyAuth } from '../middleware/auth';
import { gatherReport } from '../services/reportService';

export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { email, propertyId, name } = await request.json();
    if (!email || !propertyId) {
      return NextResponse.json({ error: 'Missing email or propertyId' }, { status: 400 });
    }

    await gatherReport(email, propertyId, name);
    return NextResponse.json({ success: true, message: 'Report sent successfully' });
  } catch (err) {
    console.error('Error sending report:', err?.message, err?.stack);
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 });
  }
}
