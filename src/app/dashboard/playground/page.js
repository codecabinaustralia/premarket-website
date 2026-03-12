'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/clientApp';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Trash2,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  Search,
  MapPin,
  BarChart3,
  Activity,
  Globe,
  X,
  ChevronUp,
  ChevronDown,
  Minus,
  RefreshCw,
  Clock,
  Zap,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreLabel(score) {
  if (score >= 81) return 'Very High';
  if (score >= 61) return 'High';
  if (score >= 41) return 'Moderate';
  if (score >= 21) return 'Low';
  return 'Very Low';
}

function scoreColor(score) {
  if (score >= 61) return 'text-emerald-600';
  if (score >= 41) return 'text-amber-600';
  return 'text-red-500';
}

function scoreBg(score) {
  if (score >= 61) return 'bg-emerald-500';
  if (score >= 41) return 'bg-amber-500';
  return 'bg-red-400';
}

function formatPrice(price) {
  if (!price) return '--';
  const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '--';
  return '$' + num.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

const SUGGESTIONS = [
  'What is the buyer sentiment for Bondi, NSW?',
  'What are the trending areas in Australia?',
  'Show me the market forecast for Melbourne CBD',
  'What is the national market overview?',
  'How have trends changed in Manly over 6 months?',
  'What is the seller sentiment for Parramatta, NSW?',
  'Compare buyer vs seller intent in Sydney',
  'Which areas have the most first home buyers?',
];

// ─── API Fetcher ────────────────────────────────────────────────────────────

async function apiFetch(endpoint, params, apiKey) {
  const url = new URL(`/api/v1/${endpoint}`, window.location.origin);
  for (const [k, v] of Object.entries(params || {})) {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: { 'x-api-key': apiKey } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ─── Score Ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80, strokeWidth = 6, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={score >= 61 ? '#10b981' : score >= 41 ? '#f59e0b' : '#ef4444'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}</span>
      </div>
      {label && <span className="text-xs text-slate-500 mt-1 font-medium">{label}</span>}
    </div>
  );
}

// ─── National Overview Cards ────────────────────────────────────────────────

function NationalOverview({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-20 mb-3" />
            <div className="h-8 bg-slate-100 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
        <div className={`text-2xl font-bold ${scoreColor(data.avgBuyerScore)}`}>{data.avgBuyerScore}</div>
        <div className="text-xs text-slate-500 mt-0.5">Buyer Intent (Avg)</div>
        <div className={`text-xs font-medium mt-1 ${scoreColor(data.avgBuyerScore)}`}>{scoreLabel(data.avgBuyerScore)}</div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <div className={`text-2xl font-bold ${scoreColor(data.avgSellerScore)}`}>{data.avgSellerScore}</div>
        <div className="text-xs text-slate-500 mt-0.5">Seller Intent (Avg)</div>
        <div className={`text-xs font-medium mt-1 ${scoreColor(data.avgSellerScore)}`}>{scoreLabel(data.avgSellerScore)}</div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-slate-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">{data.totalProperties}</div>
        <div className="text-xs text-slate-500 mt-0.5">Total Properties</div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-slate-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">{data.totalSuburbs}</div>
        <div className="text-xs text-slate-500 mt-0.5">Suburbs Tracked</div>
      </div>
    </div>
  );
}

// ─── Location Search Bar ────────────────────────────────────────────────────

function LocationSearch({ onSearch, searching }) {
  const [query, setQuery] = useState('');
  const [radius, setRadius] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim(), radius);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-900">Search Location</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suburb, postcode, or city..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">Radius</label>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="text-sm border border-slate-200 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!query.trim() || searching}
            className="px-4 py-2.5 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Area Score Cards ───────────────────────────────────────────────────────

function AreaScores({ data, loading, resolvedPlace }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-20 mb-3" />
            <div className="h-8 bg-slate-100 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { buyer, seller, forecast } = data;

  return (
    <div>
      {resolvedPlace && (
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-sm text-slate-600">{resolvedPlace}</span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Buyer Score</div>
          <div className={`text-2xl font-bold ${scoreColor(buyer?.score || 0)}`}>{buyer?.score ?? '--'}</div>
          <div className={`text-xs font-medium mt-1 ${scoreColor(buyer?.score || 0)}`}>{buyer?.score != null ? scoreLabel(buyer.score) : ''}</div>
          {buyer?.breakdown && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Serious</span><span className="font-medium text-slate-700">{buyer.breakdown.seriousBuyers}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Passive</span><span className="font-medium text-slate-700">{buyer.breakdown.passiveBuyers}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Likes</span><span className="font-medium text-slate-700">{buyer.breakdown.totalLikes}</span></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Seller Score</div>
          <div className={`text-2xl font-bold ${scoreColor(seller?.score || 0)}`}>{seller?.score ?? '--'}</div>
          <div className={`text-xs font-medium mt-1 ${scoreColor(seller?.score || 0)}`}>{seller?.score != null ? scoreLabel(seller.score) : ''}</div>
          {seller?.breakdown && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Active</span><span className="font-medium text-slate-700">{seller.breakdown.activeProperties}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">To Market (30d)</span><span className="font-medium text-slate-700">{seller.breakdown.goingToMarket30}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Eager</span><span className="font-medium text-slate-700">{seller.breakdown.eagerSellers}</span></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Demand</div>
          <div className="text-2xl font-bold text-slate-900 capitalize">{forecast?.forecast?.demandIndicator || '--'}</div>
          <div className="text-xs text-slate-500 mt-1">
            {forecast?.forecast?.demandRatio ? `Ratio: ${forecast.forecast.demandRatio.toFixed(2)}` : ''}
          </div>
          {forecast?.forecast?.expectedMedianPriceFormatted && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Median Price</span><span className="font-medium text-slate-700">{forecast.forecast.expectedMedianPriceFormatted}</span></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Properties</div>
          <div className="text-2xl font-bold text-slate-900">{buyer?.propertiesAnalyzed ?? '--'}</div>
          <div className="text-xs text-slate-500 mt-1">In search area</div>
          {forecast?.forecast?.goingToMarketNext30Days != null && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Coming soon</span><span className="font-medium text-slate-700">{forecast.forecast.goingToMarketNext30Days}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trends Chart ───────────────────────────────────────────────────────────

function TrendsChart({ trends, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-32 mb-4" />
        <div className="h-40 bg-slate-50 rounded" />
      </div>
    );
  }

  if (!trends || !trends.length) return null;

  const maxScore = Math.max(...trends.flatMap((t) => [t.buyerScore || 0, t.sellerScore || 0]), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          Historical Trends
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Buyer</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Seller</span>
        </div>
      </div>

      <div className="flex items-end gap-2 h-40">
        {trends.map((t, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center gap-0.5 flex-1">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] text-emerald-600 font-medium mb-0.5">{t.buyerScore || 0}</span>
                <div
                  className="w-full bg-emerald-500 rounded-t transition-all duration-500"
                  style={{ height: `${((t.buyerScore || 0) / maxScore) * 100}%`, minHeight: '2px' }}
                />
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] text-blue-600 font-medium mb-0.5">{t.sellerScore || 0}</span>
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-500"
                  style={{ height: `${((t.sellerScore || 0) / maxScore) * 100}%`, minHeight: '2px' }}
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">{t.monthKey?.slice(5) || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trending Areas Table ───────────────────────────────────────────────────

function TrendingAreasTable({ areas, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-32 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-slate-50 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (!areas || !areas.length) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          Trending Areas
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Suburb</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Buyer</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Seller</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Properties</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-900">
                  {area.suburb}{area.state ? `, ${area.state}` : ''}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`font-semibold ${scoreColor(area.buyerScore || 0)}`}>{area.buyerScore || 0}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`font-semibold ${scoreColor(area.sellerScore || 0)}`}>{area.sellerScore || 0}</span>
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">{area.properties || area.propertyCount || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Upcoming To Market ─────────────────────────────────────────────────────

function UpcomingToMarket({ data, loading }) {
  const [expandedState, setExpandedState] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-40 mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-slate-50 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (!data || !data.states?.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No upcoming properties detected yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Upcoming Properties</div>
          <div className="text-2xl font-bold text-slate-900">{data.totalUpcoming}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Active States</div>
          <div className="text-2xl font-bold text-slate-900">{data.states.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 lg:col-span-1">
          <div className="text-xs text-slate-500 mb-1">Top Suburb</div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {data.states[0]?.suburbs[0]?.suburb || '--'}, {data.states[0]?.state || ''}
          </div>
        </div>
      </div>

      {/* States Accordion */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Upcoming by Region
          </h3>
        </div>
        {data.states.map((st) => (
          <div key={st.state} className="border-b border-slate-100 last:border-0">
            <button
              onClick={() => setExpandedState(expandedState === st.state ? null : st.state)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-slate-900">{st.state}</span>
                <span className="text-xs text-slate-500">{st.count} properties</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-medium text-slate-600">{st.avgLikelihood}% avg likelihood</span>
                </div>
                {expandedState === st.state ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {expandedState === st.state && (
              <div className="px-5 pb-4 space-y-3">
                {st.suburbs.map((sub) => (
                  <div key={sub.suburb} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900">{sub.suburb}</span>
                      <span className="text-xs text-slate-500">{sub.count} properties &middot; {sub.avgLikelihood}% likelihood</span>
                    </div>
                    <div className="space-y-1.5">
                      {sub.properties.map((p) => (
                        <div key={p.propertyId} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 truncate flex-1 mr-2">{p.address || p.propertyId}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {p.signals.seriousBuyers > 0 && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                                {p.signals.seriousBuyers} serious
                              </span>
                            )}
                            {p.signals.goingToMarketSoon && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                                GTM {p.signals.goingToMarketDate}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded font-medium ${
                              p.likelihood >= 60 ? 'bg-emerald-100 text-emerald-700' :
                              p.likelihood >= 30 ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {p.likelihood}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Score Distribution ─────────────────────────────────────────────────────

function ScoreDistribution({ distribution, label }) {
  if (!distribution) return null;

  const entries = Object.entries(distribution);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  const description = label === 'Buyer'
    ? 'How many suburbs fall into each buyer demand range. Higher scores mean more buyer activity (opinions, serious offers, likes) relative to available properties.'
    : 'How many suburbs fall into each seller readiness range. Higher scores mean more sellers are actively preparing to go to market (eager sellers, go-to-market dates set, public listings).';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{label} Score Distribution</h3>
      <p className="text-xs text-slate-500 mb-3">{description}</p>
      <div className="space-y-2">
        {entries.map(([range, count]) => (
          <div key={range} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-12 text-right shrink-0">{range}</span>
            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${label === 'Buyer' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 w-6 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat Components ────────────────────────────────────────────────────────

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-slate-900' : 'bg-gradient-to-br from-[#e48900] to-[#c64500]'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>
      <div
        className={`rounded-xl px-3.5 py-2.5 max-w-[85%] ${
          isUser ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm prose-slate max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-semibold [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_strong]:text-slate-900">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChatPanel({ messages, input, setInput, onSend, sending, onClear, inputRef, messagesEndRef, className = '' }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-md flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">AI Assistant</span>
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-orange-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">Market Intelligence AI</p>
            <p className="text-xs text-slate-500 mb-4 max-w-[200px]">Ask about buyer sentiment, market trends, or any area in Australia</p>
            <div className="space-y-2 w-full">
              {SUGGESTIONS.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSend(s)}
                  className="w-full text-left text-xs text-slate-600 bg-slate-50 hover:bg-orange-50 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors border border-slate-100 hover:border-orange-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {sending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e48900] to-[#c64500] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white rounded-xl border border-slate-200 px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Querying market data...
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any area..."
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white disabled:opacity-50 transition-all"
            style={{ minHeight: '38px', maxHeight: '80px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
            }}
          />
          <button
            onClick={() => onSend()}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-r from-[#e48900] to-[#c64500] text-white flex items-center justify-center shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [apiAccess, setApiAccess] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);

  // Dashboard state
  const [nationalData, setNationalData] = useState(null);
  const [nationalLoading, setNationalLoading] = useState(true);
  const [trendingAreas, setTrendingAreas] = useState(null);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [areaData, setAreaData] = useState(null);
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaTrends, setAreaTrends] = useState(null);
  const [areaTrendsLoading, setAreaTrendsLoading] = useState(false);
  const [resolvedPlace, setResolvedPlace] = useState(null);
  const [upcomingData, setUpcomingData] = useState(null);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [dataRange, setDataRange] = useState('90');

  useEffect(() => {
    if (!loading && !user) router.push('/join');
  }, [user, loading, router]);

  // Listen for apiAccess
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setApiAccess(snap.data().apiAccess || { status: 'none' });
    });
    return () => unsub();
  }, [user]);

  // Scroll chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const apiKey = apiAccess?.apiKey;

  // Fetch national data + trending on load
  useEffect(() => {
    if (!apiKey) return;

    apiFetch('national-overview', {}, apiKey)
      .then(setNationalData)
      .catch((err) => console.error('National overview error:', err))
      .finally(() => setNationalLoading(false));

    apiFetch('trending-areas', { limit: 10 }, apiKey)
      .then((data) => setTrendingAreas(data.trendingAreas || []))
      .catch((err) => console.error('Trending areas error:', err))
      .finally(() => setTrendingLoading(false));

    apiFetch('upcoming-to-market', {}, apiKey)
      .then(setUpcomingData)
      .catch((err) => console.error('Upcoming to market error:', err))
      .finally(() => setUpcomingLoading(false));
  }, [apiKey]);

  // Search handler
  const handleSearch = useCallback(async (query, radius) => {
    if (!apiKey) return;
    setAreaLoading(true);
    setAreaTrendsLoading(true);
    setResolvedPlace(null);

    const params = { location: query, radius };

    try {
      const [buyer, seller, forecast] = await Promise.all([
        apiFetch('buyer-score', params, apiKey),
        apiFetch('seller-score', params, apiKey),
        apiFetch('market-forecast', params, apiKey),
      ]);

      setResolvedPlace(buyer.resolvedPlace || seller.resolvedPlace || forecast.resolvedPlace || null);
      setAreaData({ buyer, seller, forecast });
    } catch (err) {
      console.error('Area search error:', err);
      setAreaData(null);
    } finally {
      setAreaLoading(false);
    }

    try {
      const trends = await apiFetch('historical-trends', { ...params, months: 6 }, apiKey);
      setAreaTrends(trends.trends || []);
    } catch (err) {
      console.error('Trends error:', err);
      setAreaTrends(null);
    } finally {
      setAreaTrendsLoading(false);
    }
  }, [apiKey]);

  // Send chat message
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || chatInput).trim();
    if (!trimmed || sending) return;

    const userMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatInput('');
    setSending(true);

    try {
      const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  }, [chatInput, messages, sending, apiKey]);

  const clearChat = () => setMessages([]);

  // Manual sync handler
  const handleSync = useCallback(async () => {
    if (!apiKey || syncing) return;
    setSyncing(true);
    setSyncResult(null);

    // Clear all stat data so UI shows loading states
    setNationalData(null);
    setNationalLoading(true);
    setTrendingAreas(null);
    setTrendingLoading(true);
    setUpcomingData(null);
    setUpcomingLoading(true);
    setAreaData(null);
    setAreaTrends(null);
    setResolvedPlace(null);

    const maxAgeDays = dataRange === 'all' ? undefined : parseInt(dataRange);

    try {
      const res = await fetch('/api/admin/compute-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ maxAgeDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSyncResult(data);

      // Refresh dashboard data
      apiFetch('national-overview', {}, apiKey)
        .then(setNationalData)
        .catch(() => {})
        .finally(() => setNationalLoading(false));
      apiFetch('trending-areas', { limit: 10 }, apiKey)
        .then((d) => setTrendingAreas(d.trendingAreas || []))
        .catch(() => {})
        .finally(() => setTrendingLoading(false));
      apiFetch('upcoming-to-market', {}, apiKey)
        .then(setUpcomingData)
        .catch(() => {})
        .finally(() => setUpcomingLoading(false));
    } catch (err) {
      setSyncResult({ error: err.message });
      setNationalLoading(false);
      setTrendingLoading(false);
      setUpcomingLoading(false);
    } finally {
      setSyncing(false);
    }
  }, [apiKey, syncing, dataRange]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (apiAccess && apiAccess.status !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">API Access Required</h2>
          <p className="text-slate-500 mb-6">
            You need an approved API key to use the Playground. Request access from the Developer Portal.
          </p>
          <Link
            href="/dashboard/developers"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
          >
            Go to Developer Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900">Market Intelligence</h1>
                <p className="text-xs text-slate-500">Dashboard & AI Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {syncResult && !syncResult.error && (
              <span className="text-xs text-emerald-600 font-medium hidden sm:inline">
                Synced {syncResult.computed}/{syncResult.totalSuburbs} suburbs
              </span>
            )}
            {syncResult?.error && (
              <span className="text-xs text-red-500 font-medium hidden sm:inline">{syncResult.error}</span>
            )}
            <select
              value={dataRange}
              onChange={(e) => setDataRange(e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            >
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last 12 months</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Scores'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dashboard Panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            {/* National Overview */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Australia Overview
              </h2>
              <NationalOverview data={nationalData} loading={nationalLoading} />
            </div>

            {/* Score Distribution */}
            {nationalData?.scoreDistribution && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ScoreDistribution distribution={nationalData.scoreDistribution.buyer} label="Buyer" />
                <ScoreDistribution distribution={nationalData.scoreDistribution.seller} label="Seller" />
              </div>
            )}

            {/* Search */}
            <LocationSearch onSearch={handleSearch} searching={areaLoading} />

            {/* Area Results */}
            {(areaData || areaLoading) && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Area Analysis
                </h2>
                <AreaScores data={areaData} loading={areaLoading} resolvedPlace={resolvedPlace} />
              </div>
            )}

            {/* Trends for searched area */}
            {(areaTrends || areaTrendsLoading) && (
              <TrendsChart trends={areaTrends} loading={areaTrendsLoading} />
            )}

            {/* Top Areas Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {nationalData?.topBuyerAreas?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      Top Buyer Demand Areas
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Suburb</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nationalData.topBuyerAreas.map((a, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-2 text-slate-900 font-medium">{a.suburb}, {a.state}</td>
                            <td className="px-4 py-2 text-right">
                              <span className={`font-bold ${scoreColor(a.buyerScore)}`}>{a.buyerScore}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {nationalData?.topSellerAreas?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Home className="w-4 h-4 text-blue-500" />
                      Top Seller Activity Areas
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Suburb</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nationalData.topSellerAreas.map((a, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-2 text-slate-900 font-medium">{a.suburb}, {a.state}</td>
                            <td className="px-4 py-2 text-right">
                              <span className={`font-bold ${scoreColor(a.sellerScore)}`}>{a.sellerScore}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Trending Areas */}
            <TrendingAreasTable areas={trendingAreas} loading={trendingLoading} />

            {/* Upcoming To Market */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Upcoming To Market
              </h2>
              <UpcomingToMarket data={upcomingData} loading={upcomingLoading} />
            </div>
          </div>
        </div>

        {/* Desktop Chat Panel */}
        <div className="hidden lg:flex w-[380px] border-l border-slate-200 bg-white flex-shrink-0">
          <ChatPanel
            messages={messages}
            input={chatInput}
            setInput={setChatInput}
            onSend={sendMessage}
            sending={sending}
            onClear={clearChat}
            inputRef={inputRef}
            messagesEndRef={messagesEndRef}
            className="w-full"
          />
        </div>
      </div>

      {/* Mobile Floating Chat Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {!chatOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setChatOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e48900] to-[#c64500] text-white flex items-center justify-center shadow-xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-shadow"
            >
              <MessageSquare className="w-6 h-6" />
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {messages.filter((m) => m.role === 'assistant').length}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Chat Overlay */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col"
          >
            {/* Close bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-md flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-900">AI Assistant</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <ChatPanel
              messages={messages}
              input={chatInput}
              setInput={setChatInput}
              onSend={sendMessage}
              sending={sending}
              onClear={clearChat}
              inputRef={mobileInputRef}
              messagesEndRef={messagesEndRef}
              className="flex-1"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
