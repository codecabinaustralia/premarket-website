'use client';

import PHIScoreCard from './PHIScoreCard';
import { MapPin, X } from 'lucide-react';

const PHI_METRICS = [
  { key: 'bdi', code: 'BDI', name: 'Buyer Demand' },
  { key: 'smi', code: 'SMI', name: 'Seller Motivation' },
  { key: 'pvi', code: 'PVI', name: 'Price Validity' },
  { key: 'mhi', code: 'MHI', name: 'Market Heat' },
  { key: 'evs', code: 'EVS', name: 'Engagement Velocity' },
  { key: 'bqi', code: 'BQI', name: 'Buyer Quality' },
  { key: 'fpi', code: 'FPI', name: 'Forward Pipeline' },
  { key: 'sdb', code: 'SDB', name: 'Supply-Demand' },
];

export default function PHISuburbDetail({ suburb, onClose }) {
  if (!suburb) return null;

  const phi = suburb.phi || {};

  return (
    <div className="bg-slate-900 border-l border-slate-800 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">{suburb.suburb}</div>
              <div className="text-[10px] text-slate-500">{suburb.state} &middot; {suburb.propertyCount || 0} properties</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PHI_METRICS.map((m) => (
            <PHIScoreCard
              key={m.key}
              code={m.code}
              name={m.name}
              score={phi[m.key] ?? 0}
              compact
            />
          ))}
        </div>

        {/* Legacy scores */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-slate-500 mb-0.5">Buyer Score</div>
              <div className="text-lg font-bold font-mono text-slate-200">{suburb.buyerScore || 0}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 mb-0.5">Seller Score</div>
              <div className="text-lg font-bold font-mono text-slate-200">{suburb.sellerScore || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
