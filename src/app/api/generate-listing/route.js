import { NextResponse } from 'next/server';
import { generatePropertyTitleAndDescription } from '../services/openAiService';

export async function POST(request) {
  try {
    const data = await request.json();
    const { title, description } = await generatePropertyTitleAndDescription(data);
    return NextResponse.json({ title, description });
  } catch (err) {
    console.error('Error generating property details:', err);
    return NextResponse.json({ error: 'Failed to generate property details' }, { status: 500 });
  }
}
