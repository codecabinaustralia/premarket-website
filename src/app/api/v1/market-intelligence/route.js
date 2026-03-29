import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import { getAllCachedScores } from '../scoreComputation';
import { adminDb } from '../../../firebase/adminApp';
import { median } from '../helpers';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    // Get current scores, previous month trends, and property scores
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const [currentScores, trendsSnap, propScoresSnap] = await Promise.all([
      getAllCachedScores(),
      adminDb.collection('marketTrends').where('monthKey', '==', prevMonthKey).get(),
      adminDb.collection('propertyScores').get(),
    ]);

    // Build trend lookup
    const trendMap = {};
    for (const doc of trendsSnap.docs) {
      const data = doc.data();
      const key = `${(data.suburb || '').toLowerCase()}_${(data.state || '').toLowerCase()}`;
      trendMap[key] = data;
    }

    // Property-level stats
    const propScores = propScoresSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const overvalued = propScores.filter((s) => s.pvi?.status === 'overvalued' && s.pvi?.confidenceLevel !== 'low');
    const undervalued = propScores.filter((s) => s.pvi?.status === 'undervalued' && s.pvi?.confidenceLevel !== 'low');

    // === National Summary ===
    const totalSuburbs = currentScores.length;
    let totalProperties = 0;
    let totalUpcoming = 0;
    const phiSums = { bdi: 0, smi: 0, pvi: 0, mhi: 0, evs: 0, bqi: 0, fpi: 0, sdb: 0 };
    let phiCount = 0;

    for (const s of currentScores) {
      totalProperties += s.propertyCount || 0;
      totalUpcoming += s.forecastNext30?.count || 0;
      if (s.phi) {
        phiCount++;
        for (const m of Object.keys(phiSums)) {
          phiSums[m] += s.phi[m] || 0;
        }
      }
    }

    const nationalPHI = {};
    for (const m of Object.keys(phiSums)) {
      nationalPHI[m] = phiCount > 0 ? Math.round(phiSums[m] / phiCount) : 0;
    }

    const marketType = nationalPHI.sdb > 55
      ? "seller's market"
      : nationalPHI.sdb < 45
        ? "buyer's market"
        : 'balanced';

    // === Compute momentum for each suburb ===
    const suburbsWithMomentum = currentScores
      .filter((s) => s.phi)
      .map((s) => {
        const key = `${(s.suburb || '').toLowerCase()}_${(s.state || '').toLowerCase()}`;
        const prev = trendMap[key];
        const bdiDelta = prev?.phi ? (s.phi.bdi || 0) - (prev.phi.bdi || 0) : null;
        return { ...s, bdiDelta };
      });

    // === Top 5 Heating Up ===
    const heatingUp = suburbsWithMomentum
      .filter((s) => s.bdiDelta != null && s.bdiDelta > 0)
      .sort((a, b) => b.bdiDelta - a.bdiDelta)
      .slice(0, 5)
      .map((s) => ({
        suburb: s.suburb,
        state: s.state,
        bdiDelta: s.bdiDelta,
        currentBDI: s.phi.bdi,
        marketHeat: s.phi.mhi,
        propertyCount: s.propertyCount,
      }));

    // === Top 5 Cooling Down ===
    const coolingDown = suburbsWithMomentum
      .filter((s) => s.bdiDelta != null && s.bdiDelta < 0)
      .sort((a, b) => a.bdiDelta - b.bdiDelta)
      .slice(0, 5)
      .map((s) => ({
        suburb: s.suburb,
        state: s.state,
        bdiDelta: s.bdiDelta,
        currentBDI: s.phi.bdi,
        marketHeat: s.phi.mhi,
        propertyCount: s.propertyCount,
      }));

    // === SDB National Shift ===
    const prevSdbValues = Object.values(trendMap)
      .filter((t) => t.phi?.sdb != null)
      .map((t) => t.phi.sdb);
    const prevNationalSdb = prevSdbValues.length
      ? Math.round(prevSdbValues.reduce((a, b) => a + b, 0) / prevSdbValues.length)
      : null;
    const sdbShift = prevNationalSdb != null ? nationalPHI.sdb - prevNationalSdb : null;

    // === Pipeline by State ===
    const pipelineByState = {};
    for (const s of currentScores) {
      const state = (s.state || '').toUpperCase();
      if (!state) continue;
      if (!pipelineByState[state]) pipelineByState[state] = { state, upcoming: 0, total: 0 };
      pipelineByState[state].upcoming += s.forecastNext30?.count || 0;
      pipelineByState[state].total += s.propertyCount || 0;
    }
    const pipeline = Object.values(pipelineByState).sort((a, b) => b.upcoming - a.upcoming);

    // === Correction Risks (top 5) ===
    const correctionRisks = currentScores
      .filter((s) => s.phi && (s.phi.sdb > 60 || s.phi.pvi < 50 || s.phi.fpi > 60))
      .map((s) => {
        let risk = 0;
        if (s.phi.sdb > 65) risk += 30;
        else if (s.phi.sdb > 55) risk += 15;
        if (s.phi.pvi < 40) risk += 30;
        else if (s.phi.pvi < 60) risk += 15;
        if (s.phi.fpi > 70) risk += 20;
        else if (s.phi.fpi > 50) risk += 10;
        return { suburb: s.suburb, state: s.state, risk, pvi: s.phi.pvi, sdb: s.phi.sdb, fpi: s.phi.fpi };
      })
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5);

    // === Price Insights ===
    const priceInsights = {
      totalOvervalued: overvalued.length,
      totalUndervalued: undervalued.length,
      totalAnalyzed: propScores.filter((s) => s.pvi?.status).length,
      avgOvervaluedDeviation: overvalued.length
        ? Math.round(overvalued.reduce((sum, s) => sum + (s.pvi.deviationPercent || 0), 0) / overvalued.length * 10) / 10
        : null,
      avgUndervaluedDeviation: undervalued.length
        ? Math.round(undervalued.reduce((sum, s) => sum + (s.pvi.deviationPercent || 0), 0) / undervalued.length * 10) / 10
        : null,
    };

    return NextResponse.json({
      title: 'Premarket Market Intelligence Brief',
      generatedAt: new Date().toISOString(),
      comparedToMonth: prevMonthKey,

      national: {
        marketType,
        totalSuburbs,
        totalProperties,
        totalUpcomingNext30: totalUpcoming,
        phi: nationalPHI,
        sdbShift,
        sdbDirection: sdbShift > 2 ? 'shifting toward sellers' : sdbShift < -2 ? 'shifting toward buyers' : 'stable',
      },

      momentum: {
        heatingUp,
        coolingDown,
      },

      pipeline,

      corrections: correctionRisks,

      pricing: priceInsights,

      confidence: {
        highConfidence: currentScores.filter((s) => s.confidence?.level === 'high').length,
        mediumConfidence: currentScores.filter((s) => s.confidence?.level === 'medium').length,
        lowConfidence: currentScores.filter((s) => s.confidence?.level === 'low').length,
      },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'market-intelligence' } });
    console.error('Market intelligence error:', err);
    return NextResponse.json({ error: 'Failed to generate market intelligence brief' }, { status: 500 });
  }
}
