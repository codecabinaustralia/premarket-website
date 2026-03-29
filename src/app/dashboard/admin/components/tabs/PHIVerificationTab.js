'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../../../firebase/clientApp';
import { ShieldCheck, Plus, Zap } from 'lucide-react';
import StatCard from '../StatCard';
import { useToast } from '../ToastProvider';

export default function PHIVerificationTab({ user }) {
  const toast = useToast();
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    suburb: '',
    state: '',
    type: 'sale_price',
    predictedValue: '',
    actualValue: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAccuracy = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const apiKey = userDoc.data()?.apiAccess?.apiKey;
      if (!apiKey) return;

      const res = await fetch('/api/v1/phi-accuracy', {
        headers: { 'x-api-key': apiKey },
      });
      if (res.ok) {
        setAccuracy(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch accuracy:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAccuracy(); }, [fetchAccuracy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const apiKey = userDoc.data()?.apiAccess?.apiKey;
      if (!apiKey) throw new Error('No API key');

      const res = await fetch('/api/v1/phi-accuracy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          ...formData,
          predictedValue: formData.predictedValue ? parseFloat(formData.predictedValue) : null,
          actualValue: parseFloat(formData.actualValue),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Verification added! Deviation: ${data.deviationPercent != null ? `${data.deviationPercent.toFixed(1)}%` : 'N/A'}`);
      setFormData({ propertyId: '', suburb: '', state: '', type: 'sale_price', predictedValue: '', actualValue: '', notes: '' });
      setShowForm(false);
      fetchAccuracy();
    } catch (err) {
      toast.error(err.message || 'Failed to save verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-32 mb-4" />
            <div className="h-8 bg-slate-50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Accuracy Scorecard */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Accuracy Scorecard</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{accuracy?.accuracy?.pviAccuracy != null ? `${accuracy.accuracy.pviAccuracy}%` : '\u2014'}</div>
            <div className="text-xs text-slate-500 mt-1">PVI Accuracy</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Target &gt;70%</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{accuracy?.accuracy?.fpiAccuracy != null ? `${accuracy.accuracy.fpiAccuracy}%` : '\u2014'}</div>
            <div className="text-xs text-slate-500 mt-1">FPI Accuracy</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Target &gt;60%</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{accuracy?.accuracy?.bdiCorrelation != null ? accuracy.accuracy.bdiCorrelation : '\u2014'}</div>
            <div className="text-xs text-slate-500 mt-1">BDI Correlation</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Target &gt;0.5</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{accuracy?.accuracy?.smiReliability != null ? `${accuracy.accuracy.smiReliability}%` : '\u2014'}</div>
            <div className="text-xs text-slate-500 mt-1">SMI Reliability</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Target &gt;50%</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 flex-wrap">
          <span>Total Verifications: <strong className="text-slate-700">{accuracy?.totalVerifications || 0}</strong></span>
          <span>Last 30 days: <strong className="text-slate-700">{accuracy?.last30Days || 0}</strong></span>
          {accuracy?.sampleCounts && (
            <>
              <span>Sale price: {accuracy.sampleCounts.salePrice}</span>
              <span>DOM: {accuracy.sampleCounts.daysOnMarket}</span>
              <span>Outcome: {accuracy.sampleCounts.listingOutcome}</span>
            </>
          )}
        </div>
      </div>

      {/* Add Verification Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <Plus className="w-4 h-4" />
        Add Verification
      </button>

      {/* Add Verification Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">New Verification</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Property ID *</label>
              <input
                type="text"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="sale_price">Sale Price</option>
                <option value="days_on_market">Days on Market</option>
                <option value="listing_outcome">Listing Outcome</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Suburb</label>
              <input
                type="text"
                value={formData.suburb}
                onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. NSW"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Predicted Value</label>
              <input
                type="number"
                value={formData.predictedValue}
                onChange={(e) => setFormData({ ...formData, predictedValue: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. median buyer opinion"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Actual Value *</label>
              <input
                type="number"
                value={formData.actualValue}
                onChange={(e) => setFormData({ ...formData, actualValue: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                placeholder="e.g. actual sale price"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={2}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Verification'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Recent Verifications */}
      {accuracy?.recentVerifications?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Recent Verifications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Property</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Type</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Predicted</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Actual</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Deviation</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {accuracy.recentVerifications.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-900 truncate max-w-[150px]">{v.suburb ? `${v.suburb}, ${v.state}` : v.propertyId?.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        v.type === 'sale_price' ? 'bg-blue-50 text-blue-700' :
                        v.type === 'days_on_market' ? 'bg-amber-50 text-amber-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {v.type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600 font-mono">
                      {v.predictedValue != null ? v.predictedValue.toLocaleString() : '\u2014'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-900 font-mono font-medium">
                      {v.actualValue != null ? v.actualValue.toLocaleString() : '\u2014'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {v.deviationPercent != null ? (
                        <span className={`font-mono font-semibold ${
                          Math.abs(v.deviationPercent) <= 10 ? 'text-emerald-600' :
                          Math.abs(v.deviationPercent) <= 20 ? 'text-amber-600' :
                          'text-red-500'
                        }`}>
                          {v.deviationPercent > 0 ? '+' : ''}{v.deviationPercent.toFixed(1)}%
                        </span>
                      ) : '\u2014'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs truncate max-w-[200px]">{v.notes || '\u2014'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calibration Recommendations */}
      {accuracy?.calibrationRecommendations?.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            Calibration Recommendations
          </h3>
          <div className="space-y-3">
            {accuracy.calibrationRecommendations.map((r, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-bold">{r.metric}</span>
                  <span className="text-sm text-slate-700">{r.issue}</span>
                </div>
                <p className="text-xs text-slate-500">{r.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!accuracy?.recentVerifications || accuracy.recentVerifications.length === 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">No verifications yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add sale price, days on market, or listing outcome verifications to track PHI accuracy.
          </p>
        </div>
      )}
    </div>
  );
}
