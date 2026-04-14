'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useState } from 'react';

/**
 * Light, friendly PHI score tile for the buyer dashboard.
 *
 * Replaces Bloomberg-terminal styling with Apple-style typography, soft
 * gradient backgrounds, plain-English helper text, and an info popover so
 * buyers actually understand what each score means.
 */

function scoreColors(score) {
  if (score >= 75) {
    return {
      ring: 'stroke-emerald-500',
      bg: 'from-emerald-50 to-white',
      text: 'text-emerald-600',
      pill: 'bg-emerald-100 text-emerald-700',
    };
  }
  if (score >= 55) {
    return {
      ring: 'stroke-blue-500',
      bg: 'from-blue-50 to-white',
      text: 'text-blue-600',
      pill: 'bg-blue-100 text-blue-700',
    };
  }
  if (score >= 35) {
    return {
      ring: 'stroke-amber-500',
      bg: 'from-amber-50 to-white',
      text: 'text-amber-600',
      pill: 'bg-amber-100 text-amber-700',
    };
  }
  return {
    ring: 'stroke-rose-500',
    bg: 'from-rose-50 to-white',
    text: 'text-rose-600',
    pill: 'bg-rose-100 text-rose-700',
  };
}

function scoreLabel(score) {
  if (score >= 81) return 'Excellent';
  if (score >= 61) return 'Strong';
  if (score >= 41) return 'Moderate';
  if (score >= 21) return 'Weak';
  return 'Very weak';
}

export default function PHIScoreLight({
  code,
  name,
  description,
  score = 0,
  delay = 0,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const colors = scoreColors(score);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative bg-gradient-to-br ${colors.bg} border border-slate-200 rounded-3xl p-5 hover:shadow-lg hover:shadow-slate-900/5 transition-all`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-slate-900 truncate">{name}</h4>
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              aria-label="What does this mean?"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5 uppercase tracking-wider">
            {code}
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="relative w-[88px] h-[88px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                strokeWidth="9"
                fill="none"
                className="stroke-slate-100"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                strokeWidth="9"
                fill="none"
                strokeLinecap="round"
                className={colors.ring}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.1, delay: delay + 0.15, ease: 'easeOut' }}
                style={{ strokeDasharray: circumference }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-2xl font-bold ${colors.text}`}>{Math.round(score)}</div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase">/100</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${colors.pill}`}>
          {scoreLabel(score)}
        </span>
      </div>

      {showInfo && description && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 pt-3 border-t border-slate-200 overflow-hidden"
        >
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
