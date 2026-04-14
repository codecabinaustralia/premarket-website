'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronDown, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useBuyerData } from '../hooks/useBuyerData';
import { authFetch } from '../../utils/authFetch';

const BuyerLocationReport = dynamic(
  () => import('../components/insights/BuyerLocationReport'),
  { ssr: false }
);

function InsightsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { watchedAreas, loading: areasLoading } = useBuyerData();

  const [selectedId, setSelectedId] = useState(
    searchParams.get('area') || null
  );
  const [reportData, setReportData] = useState({});
  const [reportLoading, setReportLoading] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Default to first area
  useEffect(() => {
    if (!selectedId && watchedAreas.length > 0) {
      setSelectedId(watchedAreas[0].id);
    }
  }, [watchedAreas, selectedId]);

  // Keep URL in sync
  useEffect(() => {
    if (!selectedId) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('area') !== selectedId) {
      url.searchParams.set('area', selectedId);
      router.replace(url.pathname + url.search);
    }
  }, [selectedId, router]);

  const selected = useMemo(
    () => watchedAreas.find((a) => a.id === selectedId) || null,
    [watchedAreas, selectedId]
  );

  // Fetch report data whenever the selected area changes.
  useEffect(() => {
    if (!selected?.suburb || !selected?.state) return;
    let cancelled = false;
    const loc = selected.suburb;
    const st = selected.state;

    setReportData({});
    setReportLoading({
      phi: true,
      trends: true,
      buyerCompetition: true,
      forecast: true,
    });

    const endpoints = [
      {
        key: 'phi',
        url: `/api/v1/phi-scores?location=${encodeURIComponent(loc)}&state=${encodeURIComponent(st)}`,
      },
      {
        key: 'trends',
        url: `/api/v1/historical-trends?location=${encodeURIComponent(loc)}&state=${encodeURIComponent(st)}`,
      },
      {
        key: 'buyerCompetition',
        url: `/api/v1/buyer-competition?location=${encodeURIComponent(loc)}&state=${encodeURIComponent(st)}`,
      },
      {
        key: 'forecast',
        url: `/api/v1/market-forecast?location=${encodeURIComponent(loc)}&state=${encodeURIComponent(st)}`,
      },
    ];

    endpoints.forEach(async ({ key, url }) => {
      try {
        const res = await authFetch(url);
        if (!res.ok) throw new Error(`${key} failed`);
        const data = await res.json();
        if (cancelled) return;
        setReportData((prev) => ({ ...prev, [key]: data[key] ?? data }));
      } catch (err) {
        console.error(`${key} error:`, err);
      } finally {
        if (!cancelled) {
          setReportLoading((prev) => ({ ...prev, [key]: false }));
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  if (areasLoading && watchedAreas.length === 0) {
    return <div className="text-sm text-slate-400">Loading…</div>;
  }

  if (!watchedAreas.length) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-2">
            Insights
          </h1>
          <p className="text-lg text-slate-600">
            Live market intelligence for your areas.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <Activity className="w-10 h-10 text-violet-600" strokeWidth={2.25} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Add a watched area to see insights
          </h3>
          <p className="text-base text-slate-600 mb-8 max-w-md mx-auto">
            Health scores, trends, and forecasts are powered by your watched areas.
          </p>
          <Link
            href="/buyer-dashboard/areas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all"
          >
            Manage watched areas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-5"
      >
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-2">
            Insights
          </h1>
          <p className="text-lg text-slate-600">
            Live market intelligence.
          </p>
        </div>
        {/* Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-base font-semibold text-slate-900 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <MapPin className="w-5 h-5 text-orange-500" />
            <span className="truncate max-w-[220px]">
              {selected?.name || selected?.suburb || 'Select area'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 z-50 p-2"
              >
                {watchedAreas.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(a.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                      a.id === selectedId
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold truncate">{a.name || a.suburb}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {a.placeName}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Report */}
      {selected && (
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <BuyerLocationReport
            location={{
              name: selected.name || selected.suburb,
              placeName: selected.placeName,
              placeType: selected.placeType,
            }}
            reportData={reportData}
            reportLoading={reportLoading}
          />
        </motion.div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
      <InsightsInner />
    </Suspense>
  );
}
