import { NextResponse } from 'next/server';
import { validateApiKey } from '../../v1/middleware';
import {
  getUniqueSuburbs,
  computeSuburbScores,
  writeScoreToFirestore,
  clearAllMarketScores,
} from '../../v1/scoreComputation';

export const maxDuration = 300;

export async function POST(request) {
  // Validate via API key (approved users only)
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    // Parse optional maxAgeDays from request body
    let maxAgeDays;
    try {
      const body = await request.json();
      maxAgeDays = body.maxAgeDays ? parseInt(body.maxAgeDays) : undefined;
    } catch { /* no body or invalid JSON */ }

    // Clear stale entries before recomputing so old bad suburb names are removed
    const cleared = await clearAllMarketScores();

    const suburbs = await getUniqueSuburbs(maxAgeDays);
    let computed = 0;
    let skipped = 0;
    const errors = [];

    for (const s of suburbs) {
      try {
        const scores = await computeSuburbScores(s.suburb, s.state, s.lat, s.lng, { maxAgeDays });
        if (scores) {
          await writeScoreToFirestore(s.key, s.suburb, s.state, s.postcode, s.lat, s.lng, scores);
          computed++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Failed to compute scores for ${s.key}:`, err);
        errors.push({ suburb: s.key, error: err.message });
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      totalSuburbs: suburbs.length,
      computed,
      skipped,
      cleared,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    console.error('Admin compute scores error:', err);
    return NextResponse.json({ error: 'Failed to compute scores' }, { status: 500 });
  }
}
