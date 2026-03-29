'use client';

import { TrendingUp, Home, Users, BarChart3 } from 'lucide-react';

function formatPrice(price) {
  if (!price) return '--';
  const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '--';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return '$' + num.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

export default function ForecastCard({ forecast, loading }) {
  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-32 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  const stats = [
    {
      icon: Home,
      label: 'Upcoming',
      value: forecast.upcomingCount ?? forecast.totalUpcoming ?? '--',
    },
    {
      icon: BarChart3,
      label: 'Median Price',
      value: formatPrice(forecast.medianPrice ?? forecast.medianListingPrice),
    },
    {
      icon: Users,
      label: 'Demand Ratio',
      value: forecast.demandRatio != null ? `${forecast.demandRatio.toFixed(1)}x` : forecast.supplyDemandRatio != null ? `${forecast.supplyDemandRatio.toFixed(1)}x` : '--',
    },
  ];

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
        Market Forecast
      </h4>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="text-center">
              <Icon className="w-4 h-4 text-slate-600 mx-auto mb-1" />
              <div className="text-sm font-bold font-mono text-slate-200">{s.value}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      {forecast.summary && (
        <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-700/50">{forecast.summary}</p>
      )}
    </div>
  );
}
