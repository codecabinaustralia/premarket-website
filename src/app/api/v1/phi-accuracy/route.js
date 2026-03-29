import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { validateApiKey } from '../middleware';
import { adminDb } from '../../../firebase/adminApp';

/**
 * GET /api/v1/phi-accuracy
 *
 * Returns accuracy scorecard: PVI accuracy %, FPI accuracy %, BDI correlation,
 * SMI reliability, total verifications, calibration recommendations.
 *
 * POST /api/v1/phi-accuracy
 *
 * Add a new verification record.
 */
export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection('phiVerifications').get();
    const verifications = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const total = verifications.length;
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const recent = verifications.filter((v) => {
      const ts = v.verifiedAt?.toMillis?.() || v.verifiedAt?.seconds * 1000 || 0;
      return ts > thirtyDaysAgo;
    });

    // PVI Accuracy: % of sale_price verifications within 10% of prediction
    const salePriceVs = verifications.filter((v) => v.type === 'sale_price');
    const pviAccurate = salePriceVs.filter((v) => Math.abs(v.deviationPercent || 0) <= 10);
    const pviAccuracy = salePriceVs.length >= 5 ? Math.round((pviAccurate.length / salePriceVs.length) * 100) : null;

    // FPI Accuracy: % of listing_outcome verifications where prediction matched
    const listingOutcomes = verifications.filter((v) => v.type === 'listing_outcome');
    const fpiAccurate = listingOutcomes.filter((v) => Math.abs(v.deviationPercent || 0) <= 20);
    const fpiAccuracy = listingOutcomes.length >= 5 ? Math.round((fpiAccurate.length / listingOutcomes.length) * 100) : null;

    // BDI Predictive Power: correlation between BDI and days-on-market (inverted)
    const domVerifications = verifications.filter((v) => v.type === 'days_on_market' && v.phiScoresAtTime?.bdi != null);
    let bdiCorrelation = null;
    if (domVerifications.length >= 10) {
      const xs = domVerifications.map((v) => v.phiScoresAtTime.bdi);
      const ys = domVerifications.map((v) => -(v.actualValue || 0)); // Invert: higher BDI should mean fewer days
      bdiCorrelation = Math.round(pearsonCorrelation(xs, ys) * 100) / 100;
    }

    // SMI Reliability: % of high-SMI sellers who listed within 90 days
    const smiVerifications = verifications.filter((v) =>
      v.type === 'listing_outcome' && (v.phiScoresAtTime?.smi || 0) >= 60
    );
    const smiListed = smiVerifications.filter((v) => (v.actualValue || 0) > 0);
    const smiReliability = smiVerifications.length >= 5 ? Math.round((smiListed.length / smiVerifications.length) * 100) : null;

    // Calibration recommendations
    const recommendations = [];

    if (pviAccuracy !== null && pviAccuracy < 60) {
      const avgDeviation = salePriceVs.reduce((sum, v) => sum + Math.abs(v.deviationPercent || 0), 0) / salePriceVs.length;
      recommendations.push({
        metric: 'PVI',
        issue: `PVI accuracy is ${pviAccuracy}% (target >70%)`,
        suggestion: `Consider widening deviation threshold from 7% to ${Math.ceil(avgDeviation)}% based on ${salePriceVs.length} samples`,
      });
    }

    if (smiReliability !== null && smiReliability < 40) {
      recommendations.push({
        metric: 'SMI',
        issue: `SMI reliability is ${smiReliability}% (target >50%)`,
        suggestion: 'Consider increasing weight for "Testing waters" sellers (0.2 -> 0.3)',
      });
    }

    if (bdiCorrelation !== null && bdiCorrelation < 0.3) {
      recommendations.push({
        metric: 'BDI',
        issue: `BDI-to-sale-speed correlation is ${bdiCorrelation} (target >0.5)`,
        suggestion: 'Consider increasing weight for serious buyer count in BDI calculation',
      });
    }

    return NextResponse.json({
      accuracy: {
        pviAccuracy,
        fpiAccuracy,
        bdiCorrelation,
        smiReliability,
      },
      totalVerifications: total,
      last30Days: recent.length,
      sampleCounts: {
        salePrice: salePriceVs.length,
        daysOnMarket: domVerifications.length,
        listingOutcome: listingOutcomes.length,
      },
      calibrationRecommendations: recommendations,
      recentVerifications: verifications
        .sort((a, b) => {
          const ta = a.verifiedAt?.toMillis?.() || a.verifiedAt?.seconds * 1000 || 0;
          const tb = b.verifiedAt?.toMillis?.() || b.verifiedAt?.seconds * 1000 || 0;
          return tb - ta;
        })
        .slice(0, 20)
        .map((v) => ({
          id: v.id,
          propertyId: v.propertyId,
          suburb: v.suburb,
          state: v.state,
          type: v.type,
          predictedValue: v.predictedValue,
          actualValue: v.actualValue,
          deviationPercent: v.deviationPercent,
          source: v.source,
          verifiedAt: v.verifiedAt,
          notes: v.notes,
        })),
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'phi-accuracy' } });
    console.error('PHI accuracy error:', err);
    return NextResponse.json({ error: 'Failed to compute accuracy' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { propertyId, suburb, state, type, predictedValue, actualValue, source, notes } = body;

    if (!propertyId || !type || actualValue == null) {
      return NextResponse.json({ error: 'propertyId, type, and actualValue required' }, { status: 400 });
    }

    const validTypes = ['sale_price', 'days_on_market', 'listing_outcome'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    // Get current PHI scores for the property's suburb
    let phiScoresAtTime = {};
    try {
      const propDoc = await adminDb.collection('propertyScores').doc(propertyId).get();
      if (propDoc.exists) {
        phiScoresAtTime = propDoc.data()?.phi || {};
      }
    } catch (e) {
      // Non-critical
    }

    const deviationPercent = predictedValue && predictedValue !== 0
      ? Math.round(((actualValue - predictedValue) / predictedValue) * 10000) / 100
      : null;

    const { FieldValue } = await import('firebase-admin/firestore');
    const docRef = await adminDb.collection('phiVerifications').add({
      propertyId,
      suburb: suburb || null,
      state: state || null,
      type,
      predictedValue: predictedValue || null,
      actualValue,
      deviationPercent,
      phiScoresAtTime,
      source: source || 'manual',
      verifiedBy: auth.user.uid || null,
      verifiedAt: FieldValue.serverTimestamp(),
      notes: notes || null,
    });

    return NextResponse.json({ status: 'created', id: docRef.id, deviationPercent });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'phi-accuracy' } });
    console.error('Add verification error:', err);
    return NextResponse.json({ error: 'Failed to add verification' }, { status: 500 });
  }
}

// Pearson correlation coefficient
function pearsonCorrelation(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}
