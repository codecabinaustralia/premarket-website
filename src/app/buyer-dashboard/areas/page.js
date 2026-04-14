'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, X, ArrowRight } from 'lucide-react';
import LocationSearch from '../../dashboard/playground/components/LocationSearch';
import { useBuyerData } from '../hooks/useBuyerData';
import { authFetch } from '../../utils/authFetch';

export default function WatchedAreasPage() {
  const { watchedAreas, refetchAreas, loading } = useBuyerData();
  const [modalOpen, setModalOpen] = useState(false);
  const [radius, setRadius] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [phiByArea, setPhiByArea] = useState({});

  // Fetch PHI for each area
  useEffect(() => {
    if (!watchedAreas.length) return;
    let cancelled = false;
    (async () => {
      const next = {};
      for (const area of watchedAreas) {
        if (!area.suburb || !area.state) continue;
        try {
          const res = await authFetch(
            `/api/v1/phi-scores?location=${encodeURIComponent(area.suburb)}&state=${encodeURIComponent(area.state)}`
          );
          if (!res.ok) continue;
          const data = await res.json();
          next[area.id] = data;
        } catch (err) {
          console.error('phi error:', err);
        }
      }
      if (!cancelled) setPhiByArea(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [watchedAreas]);

  const handleAdd = async (loc) => {
    if (!loc) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch('/api/buyer/watched-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: loc.name,
          placeName: loc.placeName,
          suburb: loc.suburb,
          state: loc.state,
          lat: loc.lat,
          lng: loc.lng,
          placeType: loc.placeType,
          radiusKm: radius,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refetchAreas();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError('Could not add area. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/buyer/watched-areas?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('delete failed');
      await refetchAreas();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-2">
            Watched Areas
          </h1>
          <p className="text-lg text-slate-600">
            Suburbs and cities you&apos;re tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all self-start"
        >
          <Plus className="w-5 h-5" />
          Add area
        </button>
      </motion.div>

      {loading && watchedAreas.length === 0 && (
        <div className="text-sm text-slate-400">Loading…</div>
      )}

      {!loading && watchedAreas.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-blue-600" strokeWidth={2.25} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            No areas yet
          </h3>
          <p className="text-base text-slate-600 mb-8 max-w-md mx-auto">
            Add suburbs or cities to get health scores and listings updates.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add your first area
          </button>
        </motion.div>
      )}

      {watchedAreas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchedAreas.map((area, i) => {
            const phi = phiByArea[area.id]?.phi || phiByArea[area.id] || {};
            return (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group bg-white border border-slate-200 rounded-3xl p-6 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-5">
                  <Link
                    href={`/buyer-dashboard/insights?area=${area.id}`}
                    className="flex items-start gap-4 min-w-0 flex-1"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                      <MapPin className="w-5 h-5" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-bold text-slate-900 truncate">
                        {area.name || area.suburb || 'Area'}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {area.placeName} · {area.radiusKm}km
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(area.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Remove area"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Pill label="Health" value={phi.mhi} />
                  <Pill label="Demand" value={phi.bdi} />
                  <Pill label="Supply" value={phi.sdb} />
                </div>
                <Link
                  href={`/buyer-dashboard/insights?area=${area.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  View insights
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="w-full max-w-xl bg-white rounded-3xl p-7 pointer-events-auto shadow-2xl shadow-slate-900/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Add an area
                  </h2>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative z-50">
                  <LocationSearch
                    variant="light"
                    onLocationSelect={handleAdd}
                    searchRadius={radius}
                    onRadiusChange={setRadius}
                  />
                </div>
                {error && (
                  <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>
                )}
                {submitting && (
                  <p className="mt-4 text-sm text-slate-500">Saving…</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pill({ label, value }) {
  const v = typeof value === 'number' ? Math.round(value) : null;
  const tone =
    v == null
      ? 'bg-slate-50 text-slate-400'
      : v >= 70
      ? 'bg-emerald-50 text-emerald-700'
      : v >= 40
      ? 'bg-amber-50 text-amber-700'
      : 'bg-rose-50 text-rose-700';
  return (
    <div className={`rounded-2xl px-3 py-2.5 text-center ${tone}`}>
      <div className="text-2xl font-bold tracking-tight">{v ?? '—'}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 opacity-80">
        {label}
      </div>
    </div>
  );
}
