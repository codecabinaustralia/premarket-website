import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import { getAllCachedScores } from '../scoreComputation';
import { median } from '../helpers';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const stateFilter = searchParams.get('state')?.toUpperCase();

    const scores = await getAllCachedScores();

    const byState = {};
    let totalUpcoming = 0;
    let totalTracked = 0;

    for (const s of scores) {
      const state = (s.state || '').toUpperCase();
      if (!state) continue;
      if (stateFilter && state !== stateFilter) continue;

      if (!byState[state]) {
        byState[state] = { state, upcomingNext30: 0, totalProperties: 0, suburbs: [] };
      }

      const count = s.forecastNext30?.count || 0;
      const propCount = s.propertyCount || 0;

      byState[state].upcomingNext30 += count;
      byState[state].totalProperties += propCount;
      totalUpcoming += count;
      totalTracked += propCount;

      byState[state].suburbs.push({
        suburb: s.suburb,
        upcomingNext30: count,
        medianPrice: s.forecastNext30?.medianPrice || null,
        demandRatio: s.forecastNext30?.demandRatio || null,
        demandIndicator: getDemandIndicator(s.forecastNext30?.demandRatio),
        totalProperties: propCount,
        buyerScore: s.buyerScore || 0,
        sellerScore: s.sellerScore || 0,
        confidence: s.confidence?.level || 'unknown',
      });
    }

    const results = Object.values(byState)
      .map((st) => {
        st.suburbs.sort((a, b) => b.upcomingNext30 - a.upcomingNext30);
        const prices = st.suburbs
          .map((sub) => sub.medianPrice)
          .filter((p) => p != null && p > 0);
        st.medianPrice = prices.length ? median(prices) : null;
        return st;
      })
      .sort((a, b) => b.upcomingNext30 - a.upcomingNext30);

    return NextResponse.json({
      totalUpcomingNext30: totalUpcoming,
      totalPropertiesTracked: totalTracked,
      forecastWindow: '30 days',
      generatedAt: new Date().toISOString(),
      byState: results,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pipeline-forecast' } });
    console.error('Pipeline forecast error:', err);
    return NextResponse.json({ error: 'Failed to generate pipeline forecast' }, { status: 500 });
  }
}

function getDemandIndicator(ratio) {
  if (!ratio) return null;
  if (ratio >= 1.05) return 'high';
  if (ratio >= 0.95) return 'balanced';
  return 'low';
}
