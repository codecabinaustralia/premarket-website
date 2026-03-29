'use client';

import { X, MapPin, Users, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import PHIScoreCard from './PHIScoreCard';
import CompetitionCard from './CompetitionCard';
import ForecastCard from './ForecastCard';
import TrendsChart from './TrendsChart';
import PropertyValuationTable from './PropertyValuationTable';

const PHI_META = [
  { key: 'bdi', code: 'BDI', name: 'Buyer Demand' },
  { key: 'smi', code: 'SMI', name: 'Seller Motivation' },
  { key: 'pvi', code: 'PVI', name: 'Price Validity' },
  { key: 'mhi', code: 'MHI', name: 'Market Heat' },
  { key: 'evs', code: 'EVS', name: 'Engagement Velocity' },
  { key: 'bqi', code: 'BQI', name: 'Buyer Quality' },
  { key: 'fpi', code: 'FPI', name: 'Forward Pipeline' },
  { key: 'sdb', code: 'SDB', name: 'Supply-Demand' },
];

const TYPE_BADGES = {
  address: 'bg-violet-500/20 text-violet-400',
  locality: 'bg-orange-500/20 text-orange-400',
  place: 'bg-blue-500/20 text-blue-400',
  region: 'bg-emerald-500/20 text-emerald-400',
};

function typeName(t) {
  switch (t) {
    case 'address': return 'Street';
    case 'locality': return 'Suburb';
    case 'place': return 'City';
    case 'region': return 'State';
    default: return 'Location';
  }
}

function quickInsight(label, value, color) {
  if (!value) return null;
  return (
    <div className={`px-2.5 py-1.5 rounded-md border text-center ${color}`}>
      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
      <div className="text-xs font-semibold">{value}</div>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-600" />}
          {title}
        </span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && children}
    </div>
  );
}

export default function LocationReport({ location, reportData, reportLoading, onClose }) {
  if (!location) return null;

  const phi = reportData?.phi;
  const phiData = phi?.phi || phi;
  const phiBreakdown = phi?.phiBreakdown;
  const confidence = phi?.confidence;

  // Extract quick insights
  const competitionLevel = reportData?.buyerCompetition?.level || reportData?.buyerCompetition?.competitionLevel;
  const timingRec = reportData?.sellerTiming?.recommendation;
  const marketType = reportData?.forecast?.marketType;

  return (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100 truncate">{location.name}</span>
                <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${TYPE_BADGES[location.placeType] || TYPE_BADGES.locality}`}>
                  {typeName(location.placeType)}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {location.placeName}
                {confidence && <span className="ml-2 text-orange-400/60">Confidence: {typeof confidence === 'string' ? confidence : confidence.level || ''}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Quick Insights */}
        {(competitionLevel || timingRec || marketType) && (
          <div className="flex gap-2 mt-3">
            {quickInsight('Competition', competitionLevel?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 'bg-slate-800/50 border-slate-700/50 text-slate-300')}
            {quickInsight('Timing', typeof timingRec === 'string' ? (timingRec.length > 20 ? timingRec.slice(0, 20) + '...' : timingRec) : null, 'bg-slate-800/50 border-slate-700/50 text-slate-300')}
            {quickInsight('Market', marketType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 'bg-slate-800/50 border-slate-700/50 text-slate-300')}
          </div>
        )}
      </div>

      {/* Report Sections */}
      <div className="px-4 py-3 space-y-3">
        {/* PHI Scores */}
        <CollapsibleSection title="PHI Scores" icon={TrendingUp}>
          {reportLoading?.phi ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 animate-pulse">
                  <div className="h-3 bg-slate-700 rounded w-12 mb-2" />
                  <div className="h-4 bg-slate-700 rounded w-8" />
                </div>
              ))}
            </div>
          ) : phiData ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {PHI_META.map((m) => (
                <PHIScoreCard
                  key={m.key}
                  code={m.code}
                  name={m.name}
                  score={phiData[m.key] ?? 0}
                  breakdown={phiBreakdown?.[m.key]}
                  compact
                />
              ))}
            </div>
          ) : null}
        </CollapsibleSection>

        {/* Buyer Competition */}
        {(reportLoading?.buyerCompetition || reportData?.buyerCompetition) && (
          <CollapsibleSection title="Buyer Competition" icon={Users}>
            <CompetitionCard
              title="Buyer Competition"
              score={reportData?.buyerCompetition?.score ?? reportData?.buyerCompetition?.competitionScore}
              level={reportData?.buyerCompetition?.level ?? reportData?.buyerCompetition?.competitionLevel}
              summary={reportData?.buyerCompetition?.summary}
              signals={reportData?.buyerCompetition?.signals}
              risks={reportData?.buyerCompetition?.risks}
              recommendation={reportData?.buyerCompetition?.recommendation}
              loading={reportLoading?.buyerCompetition}
            />
          </CollapsibleSection>
        )}

        {/* Seller Timing */}
        {(reportLoading?.sellerTiming || reportData?.sellerTiming) && (
          <CollapsibleSection title="Seller Timing" icon={Clock}>
            <CompetitionCard
              title="Seller Timing"
              score={reportData?.sellerTiming?.score ?? reportData?.sellerTiming?.timingScore}
              level={reportData?.sellerTiming?.level ?? reportData?.sellerTiming?.timingLevel}
              summary={reportData?.sellerTiming?.summary}
              signals={reportData?.sellerTiming?.signals}
              risks={reportData?.sellerTiming?.risks}
              recommendation={reportData?.sellerTiming?.recommendation}
              loading={reportLoading?.sellerTiming}
            />
          </CollapsibleSection>
        )}

        {/* Market Forecast */}
        {(reportLoading?.forecast || reportData?.forecast) && (
          <CollapsibleSection title="Market Forecast" icon={TrendingUp}>
            <ForecastCard
              forecast={reportData?.forecast}
              loading={reportLoading?.forecast}
            />
          </CollapsibleSection>
        )}

        {/* Property Valuation */}
        {(reportLoading?.valuation || reportData?.valuation) && (
          <CollapsibleSection title="Property Valuation" defaultOpen={false}>
            <PropertyValuationTable
              data={reportData?.valuation}
              loading={reportLoading?.valuation}
            />
          </CollapsibleSection>
        )}

        {/* Historical Trends */}
        {(reportLoading?.trends || reportData?.trends) && (
          <CollapsibleSection title="Historical Trends" defaultOpen={false}>
            <TrendsChart
              trends={reportData?.trends}
              loading={reportLoading?.trends}
            />
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
