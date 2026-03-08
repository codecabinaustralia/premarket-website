import { NextResponse } from 'next/server';
import { validateApiKey } from '../middleware';
import { adminDb } from '../../../firebase/adminApp';

export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection('marketScores').get();

    if (snapshot.empty) {
      return NextResponse.json({
        avgBuyerScore: 0,
        avgSellerScore: 0,
        totalProperties: 0,
        totalSuburbs: 0,
        topBuyerAreas: [],
        topSellerAreas: [],
        scoreDistribution: { buyer: {}, seller: {} },
      });
    }

    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    let totalBuyerWeighted = 0;
    let totalSellerWeighted = 0;
    let totalWeight = 0;
    let totalProperties = 0;

    const buyerBuckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    const sellerBuckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };

    for (const doc of docs) {
      const weight = doc.propertyCount || 1;
      totalBuyerWeighted += (doc.buyerScore || 0) * weight;
      totalSellerWeighted += (doc.sellerScore || 0) * weight;
      totalWeight += weight;
      totalProperties += doc.propertyCount || 0;

      // Distribution
      const bScore = doc.buyerScore || 0;
      const sScore = doc.sellerScore || 0;
      if (bScore <= 20) buyerBuckets['0-20']++;
      else if (bScore <= 40) buyerBuckets['21-40']++;
      else if (bScore <= 60) buyerBuckets['41-60']++;
      else if (bScore <= 80) buyerBuckets['61-80']++;
      else buyerBuckets['81-100']++;

      if (sScore <= 20) sellerBuckets['0-20']++;
      else if (sScore <= 40) sellerBuckets['21-40']++;
      else if (sScore <= 60) sellerBuckets['41-60']++;
      else if (sScore <= 80) sellerBuckets['61-80']++;
      else sellerBuckets['81-100']++;
    }

    const avgBuyerScore = totalWeight > 0 ? Math.round(totalBuyerWeighted / totalWeight) : 0;
    const avgSellerScore = totalWeight > 0 ? Math.round(totalSellerWeighted / totalWeight) : 0;

    // Top areas by buyer score
    const topBuyerAreas = [...docs]
      .sort((a, b) => (b.buyerScore || 0) - (a.buyerScore || 0))
      .slice(0, 10)
      .map((d) => ({
        suburb: d.suburb,
        state: d.state,
        buyerScore: d.buyerScore || 0,
        sellerScore: d.sellerScore || 0,
        propertyCount: d.propertyCount || 0,
      }));

    // Top areas by seller score
    const topSellerAreas = [...docs]
      .sort((a, b) => (b.sellerScore || 0) - (a.sellerScore || 0))
      .slice(0, 10)
      .map((d) => ({
        suburb: d.suburb,
        state: d.state,
        buyerScore: d.buyerScore || 0,
        sellerScore: d.sellerScore || 0,
        propertyCount: d.propertyCount || 0,
      }));

    return NextResponse.json({
      avgBuyerScore,
      avgSellerScore,
      totalProperties,
      totalSuburbs: docs.length,
      topBuyerAreas,
      topSellerAreas,
      scoreDistribution: {
        buyer: buyerBuckets,
        seller: sellerBuckets,
      },
    });
  } catch (err) {
    console.error('National overview error:', err);
    return NextResponse.json({ error: 'Failed to compute national overview' }, { status: 500 });
  }
}
