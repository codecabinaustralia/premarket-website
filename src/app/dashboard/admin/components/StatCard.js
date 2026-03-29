'use client';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const COLOR_MAPPINGS = {
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  orange: 'bg-orange-50 text-orange-700',
  purple: 'bg-purple-50 text-purple-700',
  slate: 'bg-slate-100 text-slate-700'
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'slate',
  trend,
  onClick
}) {
  const colorClasses = COLOR_MAPPINGS[color] || COLOR_MAPPINGS.slate;
  const isClickable = typeof onClick === 'function';

  const trendIsPositive = trend && trend > 0;
  const trendIsNegative = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={isClickable ? onClick : undefined}
      className={`
        bg-white rounded-xl p-6 border border-slate-200
        ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}
      `}
    >
      {/* Icon row with optional trend */}
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colorClasses}`}>
          <Icon className="w-5 h-5" />
        </div>

        {trend !== undefined && trend !== null && (
          <div className={`
            flex items-center gap-1 text-xs font-semibold
            ${trendIsPositive ? 'text-emerald-600' : ''}
            ${trendIsNegative ? 'text-red-600' : ''}
            ${!trendIsPositive && !trendIsNegative ? 'text-slate-500' : ''}
          `}>
            {trendIsPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {trendIsNegative && <TrendingDown className="w-3.5 h-3.5" />}
            <span>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-slate-900 mb-1">
        {value}
      </div>

      {/* Label */}
      <div className="text-xs font-medium text-slate-600 opacity-70">
        {label}
      </div>
    </motion.div>
  );
}
