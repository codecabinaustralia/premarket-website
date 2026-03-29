import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import {
  getStaleCachedScores,
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
    const staleScores = await getStaleCachedScores();
    let recomputed = 0;
    let failed = 0;

    for (const s of staleScores) {
      try {
        const scores = await computeSuburbScores(s.suburb, s.state, s.lat, s.lng);
        if (scores) {
          await writeScoreToFirestore(s.key, s.suburb, s.state, s.postcode, s.lat, s.lng, scores);
          recomputed++;
        } else {
          failed++;
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { route: 'cleanup-stale', suburbKey: s.key } });
        console.error(`Failed to recompute stale scores for ${s.key}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      staleFound: staleScores.length,
      recomputed,
      failed,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'cleanup-stale' } });
    console.error('Cleanup stale cron error:', err);
    return NextResponse.json({ error: 'Failed to cleanup stale scores' }, { status: 500 });
  }
}
