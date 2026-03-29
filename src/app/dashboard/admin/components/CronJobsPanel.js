'use client';

import { useState } from 'react';
import { RefreshCw, Play, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { CRON_JOBS } from '../utils/constants';
import { authFetch } from '../../../utils/authFetch';

export default function CronJobsPanel({ user }) {
  const [running, setRunning] = useState({});
  const [results, setResults] = useState({});

  async function triggerJob(job) {
    setRunning((prev) => ({ ...prev, [job.key]: true }));
    setResults((prev) => ({ ...prev, [job.key]: null }));
    try {
      const res = await authFetch('/api/admin/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobKey: job.key }),
      });
      const data = await res.json().catch(() => ({}));
      setResults((prev) => ({
        ...prev,
        [job.key]: { ok: res.ok && data.success, status: res.status, data: data.result || data },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [job.key]: { ok: false, error: err.message },
      }));
    } finally {
      setRunning((prev) => ({ ...prev, [job.key]: false }));
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-600">Cron Jobs</h2>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Manual Triggers</span>
      </div>
      <div className="divide-y divide-slate-100">
        {CRON_JOBS.map((job) => {
          const isRunning = running[job.key];
          const result = results[job.key];
          return (
            <div key={job.key} className="px-6 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{job.label}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{job.schedule}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{job.desc}</p>
                {result && !isRunning && (
                  <p className={`text-[11px] mt-1 font-mono ${result.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                    {result.error
                      ? result.error
                      : result.data
                        ? Object.entries(result.data).filter(([k]) => k !== 'success' && k !== 'message').map(([k, v]) => `${k}: ${v}`).join(' · ') || 'Done'
                        : `Status ${result.status}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {result && !isRunning && (
                  result.ok
                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />
                )}
                <button
                  onClick={() => triggerJob(job)}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      Run
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
