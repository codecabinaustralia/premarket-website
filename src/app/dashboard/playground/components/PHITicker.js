'use client';

const PHI_METRICS = [
  { key: 'bdi', label: 'BDI', name: 'Buyer Demand' },
  { key: 'smi', label: 'SMI', name: 'Seller Motivation' },
  { key: 'pvi', label: 'PVI', name: 'Price Validity' },
  { key: 'mhi', label: 'MHI', name: 'Market Heat' },
  { key: 'evs', label: 'EVS', name: 'Engagement Velocity' },
  { key: 'bqi', label: 'BQI', name: 'Buyer Quality' },
  { key: 'fpi', label: 'FPI', name: 'Forward Pipeline' },
  { key: 'sdb', label: 'SDB', name: 'Supply-Demand Balance' },
];

function tickerColor(score) {
  if (score >= 61) return 'text-emerald-400';
  if (score >= 41) return 'text-amber-400';
  return 'text-red-400';
}

export default function PHITicker({ phi, loading }) {
  if (loading) {
    return (
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {PHI_METRICS.map((m) => (
            <div key={m.key} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-slate-600 font-mono uppercase">{m.label}</span>
              <div className="h-4 w-8 bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border-b border-slate-800 px-4 py-2">
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex-shrink-0">PHI</span>
        {PHI_METRICS.map((m) => {
          const score = phi?.[m.key] ?? 0;
          return (
            <div key={m.key} className="flex items-center gap-1.5 flex-shrink-0" title={m.name}>
              <span className="text-[10px] text-slate-500 font-mono">{m.label}</span>
              <span className={`text-xs font-bold font-mono ${tickerColor(score)}`}>{score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
