import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');

  if (!sessionId || !/^[a-f0-9-]+$/.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://premarketvideos.b-cdn.net/doc-sessions/${sessionId}.json`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: res.status }
      );
    }

    const events = await res.json();
    return NextResponse.json(events);
  } catch (err) {
    console.error('Failed to proxy recording:', err);
    return NextResponse.json(
      { error: 'Failed to fetch recording' },
      { status: 500 }
    );
  }
}
