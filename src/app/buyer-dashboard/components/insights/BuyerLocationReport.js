'use client';

import { motion } from 'framer-motion';
import { MapPin, TrendingUp } from 'lucide-react';
import PHIScoreLight from './PHIScoreLight';
import TrendsChartLight from './TrendsChartLight';
import CompetitionLight from './CompetitionLight';
import ForecastLight from './ForecastLight';

const PHI_META = [
  {
    key: 'mhi',
    code: 'MHI',
    name: 'Market heat',
    description:
      "How active the market is right now. High = lots of activity, sales, and buyer interest. Low = quiet, slower-moving market.",
    primary: true,
  },
  {
    key: 'bdi',
    code: 'BDI',
    name: 'Buyer demand',
    description:
      'How many buyers are actively looking in this area. Higher means more competition for each home.',
    primary: true,
  },
  {
    key: 'sdb',
    code: 'SDB',
    name: 'Supply vs demand',
    description:
      'Are there enough homes for the buyers? Higher = healthier balance for buyers; lower = sellers have the upper hand.',
    primary: true,
  },
  {
    key: 'fpi',
    code: 'FPI',
    name: 'Coming to market',
    description:
      "How many homes we expect to hit the market soon. Higher means more options heading your way.",
    primary: true,
  },
  {
    key: 'smi',
    code: 'SMI',
    name: 'Seller motivation',
    description:
      'How keen sellers are to make a deal. Higher = sellers are motivated and may negotiate.',
  },
  {
    key: 'pvi',
    code: 'PVI',
    name: 'Price realism',
    description:
      'Are listing prices in line with what homes actually sell for? Higher = priced fairly.',
  },
  {
    key: 'evs',
    code: 'EVS',
    name: 'Engagement velocity',
    description:
      'How quickly homes are being viewed, liked and offered on. Higher = the market is moving fast.',
  },
  {
    key: 'bqi',
    code: 'BQI',
    name: 'Buyer quality',
    description:
      'How serious the buyers in this area are. Higher = more buyers ready to commit.',
  },
];

const TYPE_BADGES = {
  address: 'bg-violet-100 text-violet-700',
  locality: 'bg-orange-100 text-orange-700',
  place: 'bg-blue-100 text-blue-700',
  region: 'bg-emerald-100 text-emerald-700',
};

function typeName(t) {
  switch (t) {
    case 'address':
      return 'Street';
    case 'locality':
      return 'Suburb';
    case 'place':
      return 'City';
    case 'region':
      return 'State';
    default:
      return 'Location';
  }
}

export default function BuyerLocationReport({ location, reportData, reportLoading }) {
  if (!location) return null;

  const phi = reportData?.phi;
  const phiData = phi?.phi || phi || {};

  const primaryMetrics = PHI_META.filter((m) => m.primary);
  const secondaryMetrics = PHI_META.filter((m) => !m.primary);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-gradient-to-br from-orange-50 via-amber-50/60 to-white border border-orange-100 rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">
                {location.name}
              </h2>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
                  TYPE_BADGES[location.placeType] || TYPE_BADGES.locality
                }`}
              >
                {typeName(location.placeType)}
              </span>
            </div>
            <p className="text-sm text-slate-600 truncate">{location.placeName}</p>
          </div>
        </div>
      </motion.div>

      {/* Primary metrics — the four most important for buyers */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h3 className="text-xl font-bold text-slate-900">The big picture</h3>
        </div>
        {reportLoading?.phi && !phiData?.mhi ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-50 border border-slate-200 rounded-3xl p-5 animate-pulse h-40"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {primaryMetrics.map((m, i) => (
              <PHIScoreLight
                key={m.key}
                code={m.code}
                name={m.name}
                description={m.description}
                score={phiData[m.key] ?? 0}
                delay={i * 0.06}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trends */}
      <TrendsChartLight trends={reportData?.trends} loading={reportLoading?.trends} />

      {/* Side-by-side competition + forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(reportLoading?.buyerCompetition || reportData?.buyerCompetition) && (
          <CompetitionLight
            score={
              reportData?.buyerCompetition?.score ??
              reportData?.buyerCompetition?.competitionScore
            }
            level={
              reportData?.buyerCompetition?.level ??
              reportData?.buyerCompetition?.competitionLevel
            }
            summary={reportData?.buyerCompetition?.summary}
            signals={reportData?.buyerCompetition?.signals}
            risks={reportData?.buyerCompetition?.risks}
            recommendation={reportData?.buyerCompetition?.recommendation}
            loading={reportLoading?.buyerCompetition}
          />
        )}
        {(reportLoading?.forecast || reportData?.forecast) && (
          <ForecastLight forecast={reportData?.forecast} loading={reportLoading?.forecast} />
        )}
      </div>

      {/* Secondary metrics — collapsible "more detail" */}
      <details className="group bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <div>
            <h3 className="text-lg font-bold text-slate-900">More detail</h3>
            <p className="text-sm text-slate-500">
              Four extra signals our analysts look at.
            </p>
          </div>
          <span className="text-orange-500 font-semibold text-sm group-open:rotate-180 transition-transform">
            ⌄
          </span>
        </summary>
        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryMetrics.map((m, i) => (
            <PHIScoreLight
              key={m.key}
              code={m.code}
              name={m.name}
              description={m.description}
              score={phiData[m.key] ?? 0}
              delay={i * 0.06}
            />
          ))}
        </div>
      </details>
    </div>
  );
}
