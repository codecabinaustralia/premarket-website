'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bed,
  Bath,
  Car,
  MapPin,
  Plus,
  X,
  Scale,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useBuyerData } from '../hooks/useBuyerData';

const MAX_COMPARE = 4;

function formatPrice(price) {
  if (!price) return '—';
  const n = Number(price);
  if (Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

function formatLandSize(p) {
  const n = Number(p?.landSize || p?.lotSize);
  if (!n) return '—';
  return `${n.toLocaleString()} m²`;
}

function bestValue(values, mode = 'high') {
  // Returns the index of the "best" numeric value, or -1 if no clear winner
  const nums = values.map((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null));
  const valid = nums.filter((v) => v != null);
  if (!valid.length) return -1;
  const target = mode === 'high' ? Math.max(...valid) : Math.min(...valid);
  return nums.findIndex((v) => v === target);
}

const ROWS = [
  { key: 'price', label: 'Price', best: 'low', get: (p) => Number(p?.price || 0), format: (v) => formatPrice(v) },
  { key: 'bedrooms', label: 'Bedrooms', best: 'high', get: (p) => Number(p?.bedrooms || 0), format: (v) => v || '—' },
  { key: 'bathrooms', label: 'Bathrooms', best: 'high', get: (p) => Number(p?.bathrooms || 0), format: (v) => v || '—' },
  { key: 'carSpaces', label: 'Car spaces', best: 'high', get: (p) => Number(p?.carSpaces || 0), format: (v) => v || '—' },
  { key: 'landSize', label: 'Land size', best: 'high', get: (p) => Number(p?.landSize || p?.lotSize || 0), format: (v, p) => formatLandSize(p) },
  { key: 'propertyType', label: 'Type', best: null, get: (p) => p?.propertyType || p?.type || '—' },
  { key: 'suburb', label: 'Suburb', best: null, get: (p) => p?.suburb || '—' },
];

export default function ComparePage() {
  const { likedProperties, loading } = useBuyerData();
  const [selectedIds, setSelectedIds] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selected = useMemo(
    () =>
      selectedIds
        .map((id) => likedProperties.find((l) => l.propertyId === id)?.property)
        .filter(Boolean),
    [selectedIds, likedProperties]
  );

  function toggle(propertyId) {
    setSelectedIds((prev) => {
      if (prev.includes(propertyId)) return prev.filter((id) => id !== propertyId);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, propertyId];
    });
  }

  function remove(propertyId) {
    setSelectedIds((prev) => prev.filter((id) => id !== propertyId));
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5" />
            Compare
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-2">
            Side-by-side
          </h1>
          <p className="text-lg text-slate-600">
            Pick up to 4 liked homes and weigh them up at a glance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add property
        </button>
      </motion.div>

      {selected.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <Scale className="w-10 h-10 text-violet-600" strokeWidth={2.25} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Pick a few homes to compare
          </h3>
          <p className="text-base text-slate-600 mb-8 max-w-md mx-auto">
            {likedProperties.length === 0
              ? 'Like a few properties first, then come back here to compare them side-by-side.'
              : 'Tap "Add property" above to choose from your liked homes.'}
          </p>
          {likedProperties.length === 0 ? (
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all"
            >
              Browse listings
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add property
            </button>
          )}
        </motion.div>
      )}

      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 align-bottom" />
                  {selected.map((p) => (
                    <th
                      key={p.id}
                      className="text-left p-4 align-bottom min-w-[220px]"
                    >
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors z-10"
                          aria-label="Remove from comparison"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/find-property?propertyId=${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <div className="relative aspect-[4/3] rounded-2xl bg-slate-100 overflow-hidden mb-3">
                            {p.imageUrls?.[0] ? (
                              <Image
                                src={p.imageUrls[0]}
                                alt={p.formattedAddress || p.address || 'Property'}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="220px"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <MapPin className="w-10 h-10" />
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-bold text-slate-900 truncate normal-case">
                            {p.formattedAddress || p.address || 'Property'}
                          </div>
                          <div className="text-xs text-slate-500 truncate normal-case">
                            {p.suburb}
                          </div>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const values = selected.map(row.get);
                  const winner =
                    row.best && selected.length > 1
                      ? bestValue(values, row.best)
                      : -1;
                  return (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="text-sm font-semibold text-slate-500 px-6 py-4">
                        {row.label}
                      </td>
                      {selected.map((p, i) => (
                        <td key={p.id} className="px-4 py-4 text-base font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{row.format(values[i], p)}</span>
                            {i === winner && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                <Check className="w-3 h-3" />
                                Best
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {/* Quick stats row */}
                <tr className="border-t border-slate-100">
                  <td className="text-sm font-semibold text-slate-500 px-6 py-4">
                    Quick view
                  </td>
                  {selected.map((p) => (
                    <td key={p.id} className="px-4 py-4">
                      <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                        {p.bedrooms != null && (
                          <span className="inline-flex items-center gap-1">
                            <Bed className="w-4 h-4 text-slate-400" />
                            {p.bedrooms}
                          </span>
                        )}
                        {p.bathrooms != null && (
                          <span className="inline-flex items-center gap-1">
                            <Bath className="w-4 h-4 text-slate-400" />
                            {p.bathrooms}
                          </span>
                        )}
                        {p.carSpaces != null && (
                          <span className="inline-flex items-center gap-1">
                            <Car className="w-4 h-4 text-slate-400" />
                            {p.carSpaces}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Picker modal */}
      <AnimatePresence>
        {pickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setPickerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-2xl max-h-[80vh] bg-white rounded-3xl shadow-2xl shadow-slate-900/20 z-50 flex flex-col overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Pick liked properties</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Choose up to {MAX_COMPARE} ({selectedIds.length} selected)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {likedProperties.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No liked properties yet. <Link href="/listings" className="text-orange-600 font-semibold hover:underline">Browse listings</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {likedProperties.map((l) => {
                      const p = l.property;
                      if (!p) return null;
                      const isSelected = selectedIds.includes(p.id);
                      const isFull = !isSelected && selectedIds.length >= MAX_COMPARE;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          disabled={isFull}
                          onClick={() => toggle(p.id)}
                          className={`w-full text-left flex items-center gap-4 p-3 rounded-2xl transition-all ${
                            isSelected
                              ? 'bg-orange-50 border border-orange-200'
                              : isFull
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                            {p.imageUrls?.[0] ? (
                              <Image
                                src={p.imageUrls[0]}
                                alt={p.formattedAddress || 'Property'}
                                fill
                                className="object-cover"
                                sizes="64px"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <MapPin className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {p.formattedAddress || p.address || 'Property'}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {p.suburb} · {formatPrice(p.price)}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
