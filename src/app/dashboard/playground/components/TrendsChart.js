'use client';

import { Activity } from 'lucide-react';

export default function TrendsChart({ trends, loading }) {
  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-5 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-32 mb-4" />
        <div className="h-32 bg-slate-800 rounded" />
      </div>
    );
  }

  if (!trends || !trends.length) return null;

  const maxScore = Math.max(...trends.flatMap((t) => [t.buyerScore || 0, t.sellerScore || 0]), 1);

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          Historical Trends
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Buyer</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Seller</span>
        </div>
      </div>

      <div className="flex items-end gap-2 h-32">
        {trends.map((t, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center gap-0.5 flex-1">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] text-emerald-400 font-mono mb-0.5">{t.buyerScore || 0}</span>
                <div
                  className="w-full bg-emerald-500/80 rounded-t transition-all duration-500"
                  style={{ height: `${((t.buyerScore || 0) / maxScore) * 100}%`, minHeight: '2px' }}
                />
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] text-blue-400 font-mono mb-0.5">{t.sellerScore || 0}</span>
                <div
                  className="w-full bg-blue-500/80 rounded-t transition-all duration-500"
                  style={{ height: `${((t.sellerScore || 0) / maxScore) * 100}%`, minHeight: '2px' }}
                />
              </div>
            </div>
            <span className="text-[9px] text-slate-600 mt-1 font-mono">{t.monthKey?.slice(5) || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
