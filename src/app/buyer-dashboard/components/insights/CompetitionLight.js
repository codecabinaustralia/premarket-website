'use client';

import { motion } from 'framer-motion';
import { Users, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

/**
 * Light, friendly buyer-competition card. Replaces the dark Bloomberg
 * variant with a buyer-readable, plain-English layout.
 */

function levelStyle(level) {
  switch (level) {
    case 'high':
    case 'very_high':
      return {
        text: 'text-rose-600',
        pill: 'bg-rose-100 text-rose-700',
        ring: 'stroke-rose-500',
        bg: 'from-rose-50 to-white',
      };
    case 'moderate':
    case 'medium':
      return {
        text: 'text-amber-600',
        pill: 'bg-amber-100 text-amber-700',
        ring: 'stroke-amber-500',
        bg: 'from-amber-50 to-white',
      };
    case 'low':
    case 'very_low':
      return {
        text: 'text-emerald-600',
        pill: 'bg-emerald-100 text-emerald-700',
        ring: 'stroke-emerald-500',
        bg: 'from-emerald-50 to-white',
      };
    default:
      return {
        text: 'text-slate-600',
        pill: 'bg-slate-100 text-slate-600',
        ring: 'stroke-slate-400',
        bg: 'from-slate-50 to-white',
      };
  }
}

function formatLevel(level) {
  if (!level) return '—';
  return level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CompetitionLight({
  score = 0,
  level,
  summary,
  signals = [],
  risks = [],
  recommendation,
  loading,
}) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-44 mb-3" />
        <div className="h-12 bg-slate-100 rounded w-24 mb-4" />
        <div className="h-3 bg-slate-100 rounded w-full mb-2" />
        <div className="h-3 bg-slate-100 rounded w-3/4" />
      </div>
    );
  }

  if (score == null) return null;

  const style = levelStyle(level);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className={`bg-gradient-to-br ${style.bg} border border-slate-200 rounded-3xl p-6 hover:shadow-lg hover:shadow-slate-900/5 transition-all`}>
      <div className="flex items-start gap-5">
        {/* Score ring */}
        <div className="relative w-[110px] h-[110px] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
              fill="none"
              className="stroke-slate-100"
            />
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={style.ring}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Users className={`w-4 h-4 mb-1 ${style.text}`} />
            <div className={`text-3xl font-bold ${style.text}`}>{Math.round(score)}</div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-slate-900 mb-1">Buyer competition</h3>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${style.pill}`}>
            {formatLevel(level)}
          </span>
          {summary && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{summary}</p>}
        </div>
      </div>

      {(signals.length > 0 || risks.length > 0 || recommendation) && (
        <div className="mt-5 pt-5 border-t border-slate-200 space-y-4">
          {signals.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                What we&apos;re seeing
              </div>
              <div className="space-y-2">
                {signals.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>
                      {typeof s === 'string'
                        ? s
                        : s.description || s.signal || JSON.stringify(s)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {risks.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Watch out for
              </div>
              <div className="space-y-2">
                {risks.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>
                      {typeof r === 'string'
                        ? r
                        : r.description || r.risk || JSON.stringify(r)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendation && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-0.5">
                  Our suggestion
                </div>
                <p className="text-sm text-blue-900">{recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
