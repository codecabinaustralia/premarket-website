'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Light, friendly historical trends chart for buyers.
 *
 * Renders a smooth SVG line chart of buyer demand vs seller motivation over
 * the last 6 months, with a clear "what this means" subtitle.
 */

const PADDING = { top: 20, right: 24, bottom: 32, left: 36 };
const HEIGHT = 240;

function buildPath(points) {
  if (!points.length) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

function buildAreaPath(points, baseY) {
  if (!points.length) return '';
  const top = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  return `${top} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(1)} ${baseY} Z`;
}

function trendDirection(values) {
  if (values.length < 2) return 'flat';
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  if (delta > 5) return 'up';
  if (delta < -5) return 'down';
  return 'flat';
}

function TrendBadge({ label, current, previous, color }) {
  const delta = (current ?? 0) - (previous ?? 0);
  const dir = delta > 2 ? 'up' : delta < -2 ? 'down' : 'flat';
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  const tone =
    dir === 'up'
      ? 'text-emerald-600 bg-emerald-50'
      : dir === 'down'
      ? 'text-rose-600 bg-rose-50'
      : 'text-slate-500 bg-slate-100';
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <span className="text-2xl font-bold text-slate-900">{Math.round(current ?? 0)}</span>
      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tone}`}>
        <Icon className="w-3 h-3" />
        {delta > 0 ? '+' : ''}
        {Math.round(delta)}
      </span>
    </div>
  );
}

export default function TrendsChartLight({ trends, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-40 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-64 mb-6" />
        <div className="h-60 bg-slate-50 rounded-2xl" />
      </div>
    );
  }

  if (!trends || !trends.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Last 6 months</h3>
        <p className="text-sm text-slate-500">Not enough history yet for this area.</p>
      </div>
    );
  }

  const sorted = [...trends].slice(-6);
  const buyerVals = sorted.map((t) => Number(t.buyerScore || 0));
  const sellerVals = sorted.map((t) => Number(t.sellerScore || 0));
  const allVals = [...buyerVals, ...sellerVals];
  const maxV = Math.max(100, Math.ceil(Math.max(...allVals, 0) / 10) * 10);
  const minV = 0;

  // Use viewBox so it scales fluidly
  const VB_W = 600;
  const VB_H = HEIGHT;
  const innerW = VB_W - PADDING.left - PADDING.right;
  const innerH = VB_H - PADDING.top - PADDING.bottom;
  const stepX = sorted.length > 1 ? innerW / (sorted.length - 1) : 0;

  const toPoint = (v, i) => ({
    x: PADDING.left + i * stepX,
    y: PADDING.top + innerH - ((v - minV) / (maxV - minV)) * innerH,
  });

  const buyerPoints = buyerVals.map(toPoint);
  const sellerPoints = sellerVals.map(toPoint);
  const baseY = PADDING.top + innerH;

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100];

  const buyerDir = trendDirection(buyerVals);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg hover:shadow-slate-900/5 transition-all">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Last 6 months</h3>
          <p className="text-sm text-slate-500">
            {buyerDir === 'up' && 'Buyer demand is trending up — expect more competition.'}
            {buyerDir === 'down' && 'Buyer demand is cooling — you may have more leverage.'}
            {buyerDir === 'flat' && 'The market has been steady — no big swings.'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <TrendBadge
          label="Buyers"
          current={buyerVals[buyerVals.length - 1]}
          previous={buyerVals[0]}
          color="bg-orange-500"
        />
        <TrendBadge
          label="Sellers"
          current={sellerVals[sellerVals.length - 1]}
          previous={sellerVals[0]}
          color="bg-blue-500"
        />
      </div>

      <div className="mt-6 -mx-2">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto">
          {/* Grid + Y axis */}
          {yTicks.map((tick) => {
            const y = PADDING.top + innerH - ((tick - minV) / (maxV - minV)) * innerH;
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  x2={VB_W - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400"
                  style={{ fontSize: '11px' }}
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {sorted.map((t, i) => {
            const x = PADDING.left + i * stepX;
            const label = t.monthKey?.slice(5) || t.month || '';
            return (
              <text
                key={i}
                x={x}
                y={VB_H - 8}
                textAnchor="middle"
                className="fill-slate-400"
                style={{ fontSize: '11px' }}
              >
                {label}
              </text>
            );
          })}

          {/* Buyer area */}
          <defs>
            <linearGradient id="buyerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sellerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          <motion.path
            d={buildAreaPath(buyerPoints, baseY)}
            fill="url(#buyerGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
          <motion.path
            d={buildAreaPath(sellerPoints, baseY)}
            fill="url(#sellerGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          />

          {/* Lines */}
          <motion.path
            d={buildPath(buyerPoints)}
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          />
          <motion.path
            d={buildPath(sellerPoints)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.0, delay: 0.15, ease: 'easeOut' }}
          />

          {/* Data points */}
          {buyerPoints.map((p, i) => (
            <motion.circle
              key={`b${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="white"
              stroke="#f97316"
              strokeWidth="2.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.7 + i * 0.05 }}
            />
          ))}
          {sellerPoints.map((p, i) => (
            <motion.circle
              key={`s${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="white"
              stroke="#3b82f6"
              strokeWidth="2.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.85 + i * 0.05 }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
