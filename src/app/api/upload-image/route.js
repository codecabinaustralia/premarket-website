import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const response = await fetch(
      `https://syd.storage.bunnycdn.com/premarketvideos/${filename}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': accessKey,
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: buffer,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Bunny upload failed:', text);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const cdnUrl = `https://premarketvideos.b-cdn.net/${filename}`;
    return NextResponse.json({ url: cdnUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
