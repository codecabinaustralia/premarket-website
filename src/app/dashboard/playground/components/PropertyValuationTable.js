'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function statusBadge(status) {
  switch (status) {
    case 'overvalued':
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400"><TrendingDown className="w-3 h-3" />Over</span>;
    case 'undervalued':
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400"><TrendingUp className="w-3 h-3" />Under</span>;
    case 'fair':
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-500/20 text-slate-400"><Minus className="w-3 h-3" />Fair</span>;
    default:
      return null;
  }
}

function confidenceDots(level) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= filled ? 'bg-orange-400' : 'bg-slate-700'}`} />
      ))}
    </div>
  );
}

export default function PropertyValuationTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-32 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 bg-slate-800 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (!data?.properties?.length) return null;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300">Property Valuation</h3>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span>{data.summary?.fairlyPriced || 0} fair</span>
          <span>{data.summary?.overvalued || 0} over</span>
          <span>{data.summary?.undervalued || 0} under</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700/50">
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">Address</th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">Listing</th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">Opinion</th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">Dev %</th>
              <th className="text-center px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-center px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">Conf</th>
            </tr>
          </thead>
          <tbody>
            {data.properties.slice(0, 20).map((p, i) => (
              <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-3 py-2 text-slate-300 truncate max-w-[200px]">{p.address || p.propertyId}</td>
                <td className="px-3 py-2 text-right text-slate-400 font-mono">{p.listingPriceFormatted || '--'}</td>
                <td className="px-3 py-2 text-right text-slate-300 font-mono">{p.medianOpinionFormatted || '--'}</td>
                <td className={`px-3 py-2 text-right font-mono font-semibold ${
                  p.deviationPercent > 0 ? 'text-emerald-400' : p.deviationPercent < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {p.deviationPercent > 0 ? '+' : ''}{p.deviationPercent?.toFixed(1) || '0'}%
                </td>
                <td className="px-3 py-2 text-center">{statusBadge(p.status)}</td>
                <td className="px-3 py-2 flex justify-center">{confidenceDots(p.confidenceLevel)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
