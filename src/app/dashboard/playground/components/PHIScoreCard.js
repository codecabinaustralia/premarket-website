'use client';

function scoreColor(score) {
  if (score >= 61) return 'text-emerald-400';
  if (score >= 41) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBarColor(score) {
  if (score >= 61) return 'bg-emerald-500';
  if (score >= 41) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreLabel(score) {
  if (score >= 81) return 'Very High';
  if (score >= 61) return 'High';
  if (score >= 41) return 'Moderate';
  if (score >= 21) return 'Low';
  return 'Very Low';
}

export default function PHIScoreCard({ code, name, score, breakdown, compact = false }) {
  if (compact) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500 font-mono uppercase">{code}</span>
          <span className={`text-sm font-bold font-mono ${scoreColor(score)}`}>{score}</span>
        </div>
        <div className="text-[10px] text-slate-400">{name}</div>
        <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs text-slate-500 font-mono">PHI:{code}</span>
          <div className="text-xs text-slate-400 mt-0.5">{name}</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold font-mono ${scoreColor(score)}`}>{score}</div>
          <div className={`text-[10px] font-medium ${scoreColor(score)}`}>{scoreLabel(score)}</div>
        </div>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {breakdown && (
        <div className="space-y-1 pt-2 border-t border-slate-700/50">
          {Object.entries(breakdown).slice(0, 4).map(([key, val]) => (
            <div key={key} className="flex justify-between text-[11px]">
              <span className="text-slate-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
              <span className="text-slate-300 font-mono">{typeof val === 'number' ? (val % 1 === 0 ? val : val.toFixed(2)) : String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
