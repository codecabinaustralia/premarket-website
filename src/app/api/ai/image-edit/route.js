import { NextResponse } from 'next/server';
import { verifyAuth } from '../../middleware/auth';
import { adminDb } from '../../../firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE = 'https://api.kie.ai/api/v1/jobs';
const MODEL_ID = 'nano-banana-2';

const SYSTEM_PROMPT = `IMPORTANT INSTRUCTIONS (DO NOT IGNORE):
- You are a professional real estate photo retouching artist
- You MUST maintain the exact structure, architecture, and layout of the property
- You MUST NOT add, remove, or change any structural elements (walls, windows, doors, rooms)
- You MUST NOT hallucinate or invent new features that don't exist in the original image
- Only make the specific changes requested by the user
- Focus on: lighting adjustments, color correction, decluttering, virtual staging touches, sky replacement, and enhancement
- Keep the image photorealistic and professional
- Preserve the original perspective and composition
- Remove any watermarks`;

/**
 * POST — Create a new image edit task
 * Body: { uid, propertyId, imageUrl, prompt, parentEditId?, aspectRatio? }
 */
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const uid = auth.uid;

    if (!KIE_API_KEY) {
      return NextResponse.json({ error: 'KIE API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { propertyId, imageUrl, prompt, parentEditId, aspectRatio } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: 'Missing required fields (imageUrl, prompt)' }, { status: 400 });
    }

    // Create Firestore doc with pending status
    const docRef = adminDb.collection('image_edits').doc();
    const editDoc = {
      createdAt: FieldValue.serverTimestamp(),
      userId: uid,
      listingId: propertyId || null,
      originalImageUrl: imageUrl,
      editedImageUrl: null,
      prompt,
      status: 'pending',
      jobId: null,
      errorMessage: null,
      parentEditId: parentEditId || null,
      appliedToListing: false,
      imageSize: aspectRatio || '16:9',
    };

    await docRef.set(editDoc);

    // Call KIE API
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: ${prompt}`;

    const kieResponse = await fetch(`${KIE_API_BASE}/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_ID,
        input: {
          prompt: fullPrompt,
          image_input: [imageUrl],
          aspect_ratio: aspectRatio || '16:9',
          resolution: '1K',
          output_format: 'png',
        },
      }),
    });

    const kieData = await kieResponse.json();

    if (!kieResponse.ok || kieData.code !== 200) {
      await docRef.update({
        status: 'failed',
        errorMessage: `KIE API error: ${kieResponse.status} - ${JSON.stringify(kieData)}`,
      });
      return NextResponse.json({
        error: 'Failed to create edit task',
        editId: docRef.id,
        details: kieData,
      }, { status: 502 });
    }

    const taskId = kieData.data?.taskId || kieData.data?.task_id;

    // Update doc with job ID and processing status
    await docRef.update({
      jobId: taskId,
      status: 'processing',
    });

    return NextResponse.json({
      success: true,
      editId: docRef.id,
      taskId,
      status: 'processing',
    });
  } catch (err) {
    console.error('Image edit create error:', err);
    return NextResponse.json({ error: 'Failed to create edit task' }, { status: 500 });
  }
}

/**
 * GET — Poll task status
 * Query: ?editId=xxx
 */
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!KIE_API_KEY) {
      return NextResponse.json({ error: 'KIE API key not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const editId = searchParams.get('editId');

    if (!editId) {
      return NextResponse.json({ error: 'Missing editId' }, { status: 400 });
    }

    // Get the edit doc
    const editDoc = await adminDb.collection('image_edits').doc(editId).get();
    if (!editDoc.exists) {
      return NextResponse.json({ error: 'Edit not found' }, { status: 404 });
    }

    const editData = editDoc.data();

    // If already completed or failed, just return current state
    if (editData.status === 'completed' || editData.status === 'failed') {
      return NextResponse.json({
        editId,
        status: editData.status,
        editedImageUrl: editData.editedImageUrl || null,
        errorMessage: editData.errorMessage || null,
      });
    }

    const jobId = editData.jobId;
    if (!jobId) {
      return NextResponse.json({
        editId,
        status: editData.status,
        message: 'No job ID yet — task may still be initializing',
      });
    }

    // Poll KIE API
    const pollResponse = await fetch(`${KIE_API_BASE}/recordInfo?taskId=${jobId}`, {
      headers: { 'Authorization': `Bearer ${KIE_API_KEY}` },
    });

    const pollData = await pollResponse.json();
    const data = pollData.data;

    if (!data) {
      return NextResponse.json({ editId, status: 'processing', message: 'Waiting for result' });
    }

    const state = (data.state || '').toLowerCase();

    if (state === 'success' || state === 'completed') {
      // Parse resultJson for the image URL
      let editedImageUrl = null;
      const resultJsonStr = data.resultJson;
      if (resultJsonStr && typeof resultJsonStr === 'string') {
        try {
          const resultJson = JSON.parse(resultJsonStr);
          const resultUrls = resultJson.resultUrls;
          if (Array.isArray(resultUrls) && resultUrls.length > 0) {
            editedImageUrl = resultUrls[0];
          }
        } catch {
          // ignore parse error
        }
      }

      // Fallback
      if (!editedImageUrl) {
        editedImageUrl = data.resultImageUrl || null;
      }

      await adminDb.collection('image_edits').doc(editId).update({
        status: 'completed',
        editedImageUrl,
      });

      return NextResponse.json({
        editId,
        status: 'completed',
        editedImageUrl,
      });
    }

    if (state === 'failed' || state === 'error') {
      const errorMessage = data.failMsg || data.errorMessage || 'Task failed';

      await adminDb.collection('image_edits').doc(editId).update({
        status: 'failed',
        errorMessage: String(errorMessage),
      });

      return NextResponse.json({
        editId,
        status: 'failed',
        errorMessage: String(errorMessage),
      });
    }

    // Still processing
    return NextResponse.json({
      editId,
      status: 'processing',
    });
  } catch (err) {
    console.error('Image edit poll error:', err);
    return NextResponse.json({ error: 'Failed to poll task status' }, { status: 500 });
  }
}
