'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Home, Users, BarChart3, Sparkles } from 'lucide-react';
import { formatPriceShort as formatPrice } from '../../../utils/formatters';

export default function ForecastLight({ forecast, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-40 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  const stats = [
    {
      icon: Home,
      label: 'Coming soon',
      value: forecast.upcomingCount ?? forecast.totalUpcoming ?? '—',
      sub: 'pre-market homes',
      tint: 'from-orange-50 to-white border-orange-100',
      iconBg: 'bg-orange-100 text-orange-600',
    },
    {
      icon: BarChart3,
      label: 'Median price',
      value: formatPrice(forecast.medianPrice ?? forecast.medianListingPrice),
      sub: 'in this area',
      tint: 'from-blue-50 to-white border-blue-100',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Users,
      label: 'Demand',
      value:
        forecast.demandRatio != null
          ? `${forecast.demandRatio.toFixed(1)}x`
          : forecast.supplyDemandRatio != null
          ? `${forecast.supplyDemandRatio.toFixed(1)}x`
          : '—',
      sub: 'buyers per home',
      tint: 'from-violet-50 to-white border-violet-100',
      iconBg: 'bg-violet-100 text-violet-600',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg hover:shadow-slate-900/5 transition-all">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold text-slate-900">What&apos;s ahead</h3>
      </div>
      <p className="text-sm text-slate-500 mb-5">A quick look at the months ahead.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`bg-gradient-to-br ${s.tint} border rounded-2xl p-4`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.iconBg} mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{s.value}</div>
              <div className="text-xs font-semibold text-slate-700 mt-1">{s.label}</div>
              <div className="text-[11px] text-slate-500">{s.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {forecast.summary && (
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">{forecast.summary}</p>
        </div>
      )}
    </div>
  );
}
