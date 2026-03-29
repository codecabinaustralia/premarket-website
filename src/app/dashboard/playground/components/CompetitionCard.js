'use client';

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

function levelColor(level) {
  switch (level) {
    case 'high': case 'very_high': return 'text-red-400';
    case 'moderate': case 'medium': return 'text-amber-400';
    case 'low': case 'very_low': return 'text-emerald-400';
    default: return 'text-slate-400';
  }
}

function levelBg(level) {
  switch (level) {
    case 'high': case 'very_high': return 'bg-red-500/10 border-red-500/20';
    case 'moderate': case 'medium': return 'bg-amber-500/10 border-amber-500/20';
    case 'low': case 'very_low': return 'bg-emerald-500/10 border-emerald-500/20';
    default: return 'bg-slate-500/10 border-slate-500/20';
  }
}

function formatLevel(level) {
  if (!level) return '--';
  return level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CompetitionCard({ title, score, level, summary, signals, risks, recommendation, loading }) {
  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-32 mb-3" />
        <div className="h-8 bg-slate-700 rounded w-16 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-700 rounded w-full" />
          <div className="h-3 bg-slate-700 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (score == null) return null;

  return (
    <div className={`rounded-lg border p-4 ${levelBg(level)}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-300">{title}</h4>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold font-mono ${levelColor(level)}`}>{score}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${levelColor(level)}`}>
            {formatLevel(level)}
          </span>
        </div>
      </div>

      {summary && (
        <p className="text-[11px] text-slate-400 mb-3">{summary}</p>
      )}

      {signals && signals.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Signals</div>
          <div className="space-y-1">
            {signals.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                <CheckCircle className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                <span>{typeof s === 'string' ? s : s.description || s.signal || JSON.stringify(s)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {risks && risks.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Risks</div>
          <div className="space-y-1">
            {risks.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-400/80">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{typeof r === 'string' ? r : r.description || r.risk || JSON.stringify(r)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendation && (
        <div className="flex items-start gap-1.5 pt-2 border-t border-slate-700/30">
          <Info className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-400/80">{recommendation}</p>
        </div>
      )}
    </div>
  );
}
