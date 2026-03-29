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

    // Get current scores and previous month trends for momentum comparison
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const [currentScores, trendsSnap] = await Promise.all([
      getAllCachedScores(),
      adminDb.collection('marketTrends').where('monthKey', '==', prevMonthKey).get(),
    ]);

    // Build trend lookup by suburb key
    const trendMap = {};
    for (const doc of trendsSnap.docs) {
      const data = doc.data();
      const key = `${(data.suburb || '').toLowerCase()}_${(data.state || '').toLowerCase()}`;
      trendMap[key] = data;
    }

    // Score each suburb for correction risk
    const corrections = currentScores
      .map((s) => {
        const phi = s.phi || {};
        const key = `${(s.suburb || '').toLowerCase()}_${(s.state || '').toLowerCase()}`;
        const prev = trendMap[key];

        let riskScore = 0;
        const signals = [];

        // Signal 1: Extreme seller's market (overheated)
        if (phi.sdb > 65) {
          riskScore += 25;
          signals.push({ signal: 'overheated_market', detail: `Extreme seller's market (SDB: ${phi.sdb})` });
        } else if (phi.sdb > 55) {
          riskScore += 10;
          signals.push({ signal: 'hot_market', detail: `Seller's market (SDB: ${phi.sdb})` });
        }

        // Signal 2: Supply flooding in
        if (phi.fpi > 70) {
          riskScore += 20;
          signals.push({ signal: 'supply_surge', detail: `Heavy supply pipeline (FPI: ${phi.fpi})` });
        } else if (phi.fpi > 50) {
          riskScore += 10;
          signals.push({ signal: 'supply_growing', detail: `Growing supply pipeline (FPI: ${phi.fpi})` });
        }

        // Signal 3: Pricing misalignment
        if (phi.pvi < 40) {
          riskScore += 25;
          signals.push({ signal: 'severe_mispricing', detail: `Severe pricing misalignment (PVI: ${phi.pvi})` });
        } else if (phi.pvi < 60) {
          riskScore += 15;
          signals.push({ signal: 'mispricing', detail: `Pricing misalignment (PVI: ${phi.pvi})` });
        }

        // Signal 4: Demand weakening month-over-month
        if (prev?.phi?.bdi != null && phi.bdi != null) {
          const bdiDelta = phi.bdi - prev.phi.bdi;
          if (bdiDelta < -10) {
            riskScore += 20;
            signals.push({ signal: 'demand_dropping', detail: `Buyer demand dropping fast (BDI: ${prev.phi.bdi} -> ${phi.bdi})` });
          } else if (bdiDelta < -5) {
            riskScore += 10;
            signals.push({ signal: 'demand_softening', detail: `Buyer demand softening (BDI: ${prev.phi.bdi} -> ${phi.bdi})` });
          }
        }

        // Signal 5: Demand ratio below 1 (buyers think prices are too high)
        const demandRatio = s.forecastNext30?.demandRatio;
        if (demandRatio && demandRatio < 0.85) {
          riskScore += 15;
          signals.push({ signal: 'buyers_below_asking', detail: `Buyers offering well below asking (demand ratio: ${demandRatio})` });
        } else if (demandRatio && demandRatio < 0.95) {
          riskScore += 5;
          signals.push({ signal: 'soft_demand', detail: `Buyers offering below asking (demand ratio: ${demandRatio})` });
        }

        // Signal 6: Sellers getting eager while demand is low
        if (prev?.phi?.smi != null && phi.smi != null) {
          const smiDelta = phi.smi - prev.phi.smi;
          if (smiDelta > 10 && phi.bdi < 40) {
            riskScore += 15;
            signals.push({ signal: 'seller_pressure', detail: `Sellers getting eager while demand is low (SMI: ${prev.phi.smi} -> ${phi.smi})` });
          }
        }

        if (riskScore === 0) return null;

        return {
          suburb: s.suburb,
          state: s.state,
          correctionRisk: Math.min(riskScore, 100),
          riskLevel: riskScore >= 60 ? 'high' : riskScore >= 35 ? 'moderate' : 'low',
          signals,
          currentPHI: phi,
          previousPHI: prev?.phi || null,
          demandRatio,
          propertyCount: s.propertyCount || 0,
          confidence: s.confidence?.level || 'unknown',
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.correctionRisk - a.correctionRisk)
      .slice(0, limit);

    return NextResponse.json({
      totalAreasAnalyzed: currentScores.length,
      areasWithCorrectionSignals: corrections.length,
      comparedToMonth: prevMonthKey,
      generatedAt: new Date().toISOString(),
      corrections,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'market-corrections' } });
    console.error('Market corrections error:', err);
    return NextResponse.json({ error: 'Failed to generate market corrections' }, { status: 500 });
  }
}
