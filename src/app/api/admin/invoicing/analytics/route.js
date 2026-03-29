import { NextResponse } from 'next/server';
import { adminDb } from '../../../../firebase/adminApp';
import { verifyAdmin } from '../../../middleware/auth';

/**
 * GET /api/admin/invoicing/analytics?months=12
 * Monthly aggregates from completed/sent runs + forecast.
 */
export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12', 10);

    // Get all completed/sent runs
    const runsSnap = await adminDb
      .collection('invoiceRuns')
      .where('status', 'in', ['sent', 'approved', 'completed'])
      .orderBy('periodStart', 'desc')
      .limit(months)
      .get();

    const monthlyData = [];

    for (const runDoc of runsSnap.docs) {
      const run = runDoc.data();
      const periodStart = run.periodStart?.toDate?.() || new Date(run.periodStart);
      const monthKey = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;

      // Get items for this run to compute paid vs outstanding
      const itemsSnap = await adminDb
        .collection('invoiceRunItems')
        .where('runId', '==', runDoc.id)
        .get();

      let paidAmount = 0;
      let outstandingAmount = 0;
      for (const itemDoc of itemsSnap.docs) {
        const item = itemDoc.data();
        if (item.xeroStatus === 'PAID' || item.paidAt) {
          paidAmount += item.totalInc || 0;
        } else {
          outstandingAmount += item.totalInc || 0;
        }
      }

      monthlyData.push({
        month: monthKey,
        totalProperties: run.totalProperties || 0,
        totalAmount: run.totalAmountInc || 0,
        agencyCount: run.totalAgencies || 0,
        paidAmount: Math.round(paidAmount * 100) / 100,
        outstandingAmount: Math.round(outstandingAmount * 100) / 100,
      });
    }

    // Sort chronologically
    monthlyData.sort((a, b) => a.month.localeCompare(b.month));

    // Forecast: simple linear projection from last 3-6 data points
    const forecast = computeForecast(monthlyData);

    return NextResponse.json({ monthlyData, forecast });
  } catch (err) {
    console.error('Invoicing analytics GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function computeForecast(data) {
  if (data.length < 2) return null;

  const recent = data.slice(-6);
  const amounts = recent.map((d) => d.totalAmount);
  const properties = recent.map((d) => d.totalProperties);

  // Simple linear regression
  const n = amounts.length;
  const xMean = (n - 1) / 2;
  const yMeanAmt = amounts.reduce((s, v) => s + v, 0) / n;
  const yMeanProp = properties.reduce((s, v) => s + v, 0) / n;

  let numAmt = 0, numProp = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    numAmt += xDiff * (amounts[i] - yMeanAmt);
    numProp += xDiff * (properties[i] - yMeanProp);
    den += xDiff * xDiff;
  }

  const slopeAmt = den !== 0 ? numAmt / den : 0;
  const slopeProp = den !== 0 ? numProp / den : 0;

  // Project next month
  const nextIdx = n;
  const forecastAmount = Math.max(0, Math.round((yMeanAmt + slopeAmt * (nextIdx - xMean)) * 100) / 100);
  const forecastProperties = Math.max(0, Math.round(yMeanProp + slopeProp * (nextIdx - xMean)));

  // Next month key
  const lastMonth = data[data.length - 1].month;
  const [y, m] = lastMonth.split('-').map(Number);
  const nextDate = new Date(y, m, 1); // m is already 1-based, so this gives next month
  const nextMonthKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

  return {
    month: nextMonthKey,
    forecastAmount,
    forecastProperties,
    trend: slopeAmt > 0 ? 'up' : slopeAmt < 0 ? 'down' : 'flat',
    confidence: n >= 4 ? 'medium' : 'low',
  };
}
