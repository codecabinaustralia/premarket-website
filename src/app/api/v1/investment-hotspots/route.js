import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import { getAllCachedScores } from '../scoreComputation';
import { adminDb } from '../../../firebase/adminApp';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 50);
    const strategy = searchParams.get('strategy') || 'balanced';

    // Get current scores and previous month for momentum
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const [currentScores, trendsSnap] = await Promise.all([
      getAllCachedScores(),
      adminDb.collection('marketTrends').where('monthKey', '==', prevMonthKey).get(),
    ]);

    const trendMap = {};
    for (const doc of trendsSnap.docs) {
      const data = doc.data();
      const key = `${(data.suburb || '').toLowerCase()}_${(data.state || '').toLowerCase()}`;
      trendMap[key] = data;
    }

    // Score each suburb for investment opportunity
    const hotspots = currentScores
      .map((s) => {
        const phi = s.phi || {};
        const conf = s.confidence;
        if (conf?.level === 'low') return null; // skip low-confidence areas
        if ((s.propertyCount || 0) < 2) return null; // need minimum data

        const key = `${(s.suburb || '').toLowerCase()}_${(s.state || '').toLowerCase()}`;
        const prev = trendMap[key];

        const opp = scoreOpportunity(phi, prev?.phi, s.forecastNext30, strategy);
        if (opp.score === 0) return null;

        return {
          suburb: s.suburb,
          state: s.state,
          opportunityScore: opp.score,
          investmentGrade: opp.grade,
          strategy: opp.matchedStrategy,
          signals: opp.signals,
          phi: {
            bdi: phi.bdi,
            smi: phi.smi,
            sdb: phi.sdb,
            pvi: phi.pvi,
            fpi: phi.fpi,
            evs: phi.evs,
            bqi: phi.bqi,
            mhi: phi.mhi,
          },
          momentum: prev?.phi ? {
            bdiDelta: (phi.bdi || 0) - (prev.phi.bdi || 0),
            sdbDelta: (phi.sdb || 0) - (prev.phi.sdb || 0),
          } : null,
          demandRatio: s.forecastNext30?.demandRatio || null,
          propertyCount: s.propertyCount || 0,
          confidence: conf?.level || 'unknown',
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, limit);

    return NextResponse.json({
      totalAreasAnalyzed: currentScores.length,
      hotspotsFound: hotspots.length,
      strategy,
      generatedAt: new Date().toISOString(),
      hotspots,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'investment-hotspots' } });
    console.error('Investment hotspots error:', err);
    return NextResponse.json({ error: 'Failed to generate investment hotspots' }, { status: 500 });
  }
}

function scoreOpportunity(phi, prevPhi, forecast, strategy) {
  const bdi = phi.bdi || 0;
  const sdb = phi.sdb || 50;
  const pvi = phi.pvi || 50;
  const fpi = phi.fpi || 0;
  const evs = phi.evs || 0;
  const bqi = phi.bqi || 0;
  const mhi = phi.mhi || 0;

  let score = 0;
  const signals = [];
  let matchedStrategy = strategy;

  // BDI momentum (demand acceleration)
  const bdiDelta = prevPhi ? (bdi - (prevPhi.bdi || 0)) : 0;
  if (bdiDelta > 10) {
    score += 20;
    signals.push(`Demand accelerating fast (+${bdiDelta} BDI month-over-month)`);
  } else if (bdiDelta > 5) {
    score += 10;
    signals.push(`Demand growing (+${bdiDelta} BDI month-over-month)`);
  }

  if (strategy === 'value' || strategy === 'balanced') {
    // Value strategy: buyer's market + undervalued = negotiating power + upside
    if (sdb < 45) {
      score += 15;
      signals.push("Buyer's market — negotiating power for lower entry price");
    }
    if (pvi > 70 && sdb < 50) {
      score += 10;
      signals.push('Well-priced area in buyer-friendly conditions');
    }
    // Undervalued properties (buyers think worth more than asking)
    const demandRatio = forecast?.demandRatio;
    if (demandRatio && demandRatio > 1.05) {
      score += 15;
      signals.push(`Buyers willing to pay above asking (ratio: ${demandRatio}) — potential upside`);
    }
  }

  if (strategy === 'growth' || strategy === 'balanced') {
    // Growth strategy: rising demand + improving engagement
    if (bdi > 50 && bdiDelta > 0) {
      score += 15;
      signals.push('Strong and growing buyer demand');
    }
    if (evs > 50) {
      score += 10;
      signals.push('Fast engagement — properties attract interest quickly');
    }
    if (bqi > 50) {
      score += 10;
      signals.push('Quality buyers — financially ready investors and upgraders');
    }
  }

  if (strategy === 'yield' || strategy === 'balanced') {
    // Yield strategy: high demand + low supply + quality buyers
    if (sdb > 55) {
      score += 10;
      signals.push('Demand exceeds supply — rental/investment demand likely strong');
    }
    if (fpi < 40) {
      score += 10;
      signals.push('Limited new supply coming — less future competition');
    }
  }

  // Universal positive: high market heat
  if (mhi > 60) {
    score += 10;
    signals.push('High market heat — active, dynamic market');
  }

  // Cap and grade
  score = Math.min(score, 100);
  let grade;
  if (score >= 70) grade = 'A';
  else if (score >= 55) grade = 'B';
  else if (score >= 40) grade = 'C';
  else grade = 'D';

  return { score, grade, signals, matchedStrategy };
}
