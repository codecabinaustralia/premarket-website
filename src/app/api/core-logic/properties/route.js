import { NextResponse } from 'next/server';
import { getPropertyIdAndSave } from '../../services/coreLogicService';

export async function POST(request) {
  try {
    const { address, userId } = await request.json();
    const result = await getPropertyIdAndSave(address, userId);
    return NextResponse.json({ message: 'Property saved', ...result });
  } catch (err) {
    console.error('CoreLogic error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
