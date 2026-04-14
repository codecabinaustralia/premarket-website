import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/adminApp';
import { getAllCachedScores } from '../../v1/scoreComputation';

const STATE_NAMES = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  SA: 'South Australia',
  WA: 'Western Australia',
  TAS: 'Tasmania',
  NT: 'Northern Territory',
  ACT: 'Australian Capital Territory',
};

export async function GET() {
  try {
    // Get current scores and previous month trends
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const [currentScores, trendsSnap] = await Promise.all([
      getAllCachedScores(),
      adminDb.collection('marketTrends').where('monthKey', '==', prevMonthKey).get(),
    ]);

    // Build trend lookup
    const trendMap = {};
    for (const doc of trendsSnap.docs) {
      const data = doc.data();
      const key = `${(data.suburb || '').toLowerCase()}_${(data.state || '').toLowerCase()}`;
      trendMap[key] = data;
    }

    // Build ticker items sorted by BDI descending, take top 15
    const items = currentScores
      .filter((s) => s.phi?.bdi != null && s.propertyCount > 0)
      .map((s) => {
        const bdi = Math.round(s.phi.bdi);
        const key = `${(s.suburb || '').toLowerCase()}_${(s.state || '').toLowerCase()}`;
        const prev = trendMap[key];
        const prevBdi = prev?.phi?.bdi;

        let delta = null;
        if (prevBdi != null) {
          delta = (bdi - Math.round(prevBdi)).toFixed(1);
          if (delta > 0) delta = `+${delta}`;
        }

        return {
          suburb: s.suburb,
          state: STATE_NAMES[s.state] || s.state,
          score: bdi,
          delta,
          properties: s.propertyCount,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    const response = NextResponse.json({ items });
    // Cache for 1 hour at edge, allow stale for 4 hours while revalidating
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=14400');
    return response;
  } catch (err) {
    console.error('Ticker data error:', err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
