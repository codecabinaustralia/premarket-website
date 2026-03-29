'use client';

const METRICS = [
  { key: 'mhi', label: 'MHI', name: 'Market Heat' },
  { key: 'bdi', label: 'BDI', name: 'Buyer Demand' },
  { key: 'smi', label: 'SMI', name: 'Seller Motivation' },
  { key: 'pvi', label: 'PVI', name: 'Price Validity' },
  { key: 'evs', label: 'EVS', name: 'Engagement Velocity' },
  { key: 'bqi', label: 'BQI', name: 'Buyer Quality' },
  { key: 'fpi', label: 'FPI', name: 'Forward Pipeline' },
  { key: 'sdb', label: 'SDB', name: 'Supply-Demand' },
];

export default function HeatmapControls({ selected, onSelect }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 px-1">
      {METRICS.map((m) => (
        <button
          key={m.key}
          onClick={() => onSelect(m.key)}
          title={m.name}
          className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex-shrink-0 ${
            selected === m.key
              ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
