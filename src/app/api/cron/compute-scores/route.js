import { NextResponse } from 'next/server';
import {
  getUniqueSuburbs,
  computeSuburbScores,
  writeScoreToFirestore,
} from '../../v1/scoreComputation';

export const maxDuration = 300;

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const suburbs = await getUniqueSuburbs();
    let computed = 0;
    let skipped = 0;

    for (const s of suburbs) {
      try {
        const scores = await computeSuburbScores(s.suburb, s.state, s.lat, s.lng);
        if (scores) {
          await writeScoreToFirestore(s.key, s.suburb, s.state, s.postcode, s.lat, s.lng, scores);
          computed++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Failed to compute scores for ${s.key}:`, err);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      totalSuburbs: suburbs.length,
      computed,
      skipped,
    });
  } catch (err) {
    console.error('Compute scores cron error:', err);
    return NextResponse.json({ error: 'Failed to compute scores' }, { status: 500 });
  }
}
