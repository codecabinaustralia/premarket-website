import { NextResponse } from 'next/server';
import { verifyAuth } from '../../middleware/auth';
import { getPropertyIdAndSave } from '../../services/coreLogicService';

export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { address } = await request.json();
    const result = await getPropertyIdAndSave(address, auth.uid);
    return NextResponse.json({ message: 'Property saved', ...result });
  } catch (err) {
    console.error('CoreLogic error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
