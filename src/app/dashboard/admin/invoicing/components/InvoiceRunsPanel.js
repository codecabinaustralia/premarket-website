'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowLeft, Trash2, Calendar, Building2, FileText, DollarSign } from 'lucide-react';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import InvoiceRunDetail from './InvoiceRunDetail';

function getDefaultDates() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export default function InvoiceRunsPanel({ user }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dateFrom, setDateFrom] = useState(getDefaultDates().from);
  const [dateTo, setDateTo] = useState(getDefaultDates().to);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/invoicing/runs?adminUid=${user.uid}`);
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (err) {
      console.error('Fetch runs error:', err);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const fetchRunDetail = useCallback(async (runId) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/invoicing/runs/${runId}?adminUid=${user.uid}`);
      const data = await res.json();
      setSelectedRun(data.run);
      setSelectedItems(data.items || []);
    } catch (err) {
      console.error('Fetch run detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    if (selectedRunId) {
      fetchRunDetail(selectedRunId);
    }
  }, [selectedRunId, fetchRunDetail]);

  async function handleCreateRun() {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/invoicing/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid: user.uid, dateFrom, dateTo }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRunId(data.runId);
        setShowCreateForm(false);
        await fetchRuns();
      } else {
        alert(data.error || 'Failed to create run');
      }
    } catch (err) {
      console.error('Create run error:', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteRun(runId, e) {
    e.stopPropagation();
    if (!confirm('Delete this draft run?')) return;
    try {
      await fetch(`/api/admin/invoicing/runs/${runId}?adminUid=${user.uid}`, { method: 'DELETE' });
      if (selectedRunId === runId) {
        setSelectedRunId(null);
        setSelectedRun(null);
        setSelectedItems([]);
      }
      await fetchRuns();
    } catch (err) {
      console.error('Delete run error:', err);
    }
  }

  function handleRefresh() {
    if (selectedRunId) fetchRunDetail(selectedRunId);
    fetchRuns();
  }

  // Show detail view if a run is selected
  if (selectedRunId) {
    if (detailLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
        </div>
      );
    }

    if (!selectedRun) {
      return (
        <div className="text-center py-12 text-slate-400">Run not found</div>
      );
    }

    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelectedRunId(null); setSelectedRun(null); setSelectedItems([]); }}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to runs
        </button>
        <InvoiceRunDetail
          run={selectedRun}
          items={selectedItems}
          user={user}
          onRefresh={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Invoice runs for monthly agency billing at $200/listing.
        </p>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" />
          New Invoice Run
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Create Invoice Run</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-slate-900 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-slate-900 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Properties created between these dates that haven't been invoiced will be included.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateRun}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Generate Dry Run'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Runs List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No invoice runs yet</p>
          <p className="text-slate-400 text-xs mt-1">Create your first run to generate invoices for the previous month.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => {
            const periodStart = run.periodStart?.toDate?.()
              || (run.periodStart?._seconds ? new Date(run.periodStart._seconds * 1000) : new Date(run.periodStart));
            const periodEnd = run.periodEnd?.toDate?.()
              || (run.periodEnd?._seconds ? new Date(run.periodEnd._seconds * 1000) : new Date(run.periodEnd));
            const fmtStart = periodStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
            const fmtEnd = periodEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-orange-200 hover:shadow-sm cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{fmtStart} – {fmtEnd}</p>
                        <InvoiceStatusBadge status={run.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{run.totalAgencies} agencies
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />{run.totalProperties} properties
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-1 justify-end">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        {run.totalAmountInc?.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">Gross (inc GST)</p>
                    </div>
                    {run.status === 'draft' && (
                      <button
                        onClick={(e) => handleDeleteRun(run.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
