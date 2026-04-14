'use client';

import { motion } from 'framer-motion';

export default function StatCard({ label, value, sub, icon: Icon, accent = 'orange', delay = 0 }) {
  const accentMap = {
    orange: {
      bg: 'from-orange-50 to-amber-50/50',
      border: 'border-orange-100',
      iconBg: 'bg-orange-100 text-orange-600',
      number: 'text-slate-900',
    },
    emerald: {
      bg: 'from-emerald-50 to-teal-50/50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-600',
      number: 'text-slate-900',
    },
    blue: {
      bg: 'from-blue-50 to-sky-50/50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100 text-blue-600',
      number: 'text-slate-900',
    },
    violet: {
      bg: 'from-violet-50 to-purple-50/50',
      border: 'border-violet-100',
      iconBg: 'bg-violet-100 text-violet-600',
      number: 'text-slate-900',
    },
  };
  const a = accentMap[accent] || accentMap.orange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-gradient-to-br ${a.bg} border ${a.border} rounded-3xl p-6 shadow-sm shadow-slate-900/[0.02]`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-semibold text-slate-600">{label}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-2xl ${a.iconBg} flex items-center justify-center`}>
            <Icon className="w-5 h-5" strokeWidth={2.25} />
          </div>
        )}
      </div>
      <div className={`text-4xl font-bold tracking-tight ${a.number}`}>
        {value ?? '—'}
      </div>
      {sub && (
        <div className="text-xs font-medium text-slate-500 mt-2 truncate">{sub}</div>
      )}
    </motion.div>
  );
}
