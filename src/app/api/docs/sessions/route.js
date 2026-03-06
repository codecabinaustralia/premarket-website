import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const {
      linkToken,
      sessionId,
      startedAt,
      duration,
      sectionsViewed,
      interactions,
      recording,
      userAgent,
      referrer,
    } = await request.json();

    if (!linkToken || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate the link token
    const linkDoc = await adminDb.collection('docLinks').doc(linkToken).get();
    if (!linkDoc.exists || linkDoc.data().active !== true) {
      return NextResponse.json({ error: 'Invalid or inactive link' }, { status: 403 });
    }

    // Upload rrweb recording to Bunny CDN if provided
    let recordingUrl = null;
    if (recording && recording.length > 0) {
      const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
      if (accessKey) {
        const jsonBody = JSON.stringify(recording);
        const uploadRes = await fetch(
          `https://syd.storage.bunnycdn.com/premarketvideos/doc-sessions/${sessionId}.json`,
          {
            method: 'PUT',
            headers: {
              'AccessKey': accessKey,
              'Content-Type': 'application/json',
            },
            body: jsonBody,
          }
        );

        if (uploadRes.ok) {
          recordingUrl = `https://premarketvideos.b-cdn.net/doc-sessions/${sessionId}.json`;
        } else {
          console.error('Bunny upload failed:', await uploadRes.text());
        }
      }
    }

    // Check if session already exists
    const sessionRef = adminDb.collection('docSessions').doc(sessionId);
    const existingDoc = await sessionRef.get();

    if (existingDoc.exists) {
      // Update existing session
      const updateData = {
        duration: duration || 0,
        sectionsViewed: sectionsViewed || [],
        interactions: interactions || [],
        endedAt: new Date().toISOString(),
      };
      if (recordingUrl) updateData.recordingUrl = recordingUrl;
      await sessionRef.update(updateData);
    } else {
      // Create new session
      await sessionRef.set({
        linkToken,
        sessionId,
        startedAt: startedAt || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        duration: duration || 0,
        sectionsViewed: sectionsViewed || [],
        interactions: interactions || [],
        recordingUrl,
        userAgent: userAgent || null,
        referrer: referrer || null,
      });

      // Increment session count on the link doc
      await adminDb.collection('docLinks').doc(linkToken).update({
        sessionCount: FieldValue.increment(1),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Save doc session error:', err);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
