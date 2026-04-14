'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Clock,
  Bed,
  Bath,
  Car,
  MapPin,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import LikeButton from '../../components/LikeButton';

function formatPrice(price) {
  if (!price) return 'Price on request';
  const n = Number(price);
  if (Number.isNaN(n)) return price;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

function CountdownPill({ days }) {
  if (days == null) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
        <Lock className="w-3 h-3" />
        Pre-market
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
        <Clock className="w-3 h-3" />
        Going public today
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
        <Clock className="w-3 h-3" />
        {days} day{days === 1 ? '' : 's'} until public
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
      <Clock className="w-3 h-3" />
      Public in {days} days
    </span>
  );
}

function EarlyAccessCard({ property, delay }) {
  const image = property.imageUrl;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm shadow-slate-900/[0.03] hover:shadow-xl hover:shadow-slate-900/[0.08] hover:border-orange-200 transition-shadow"
    >
      <Link
        href={`/find-property?propertyId=${property.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-[4/3] bg-slate-100">
          {image ? (
            <Image
              src={image}
              alt={property.address}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <MapPin className="w-10 h-10" />
            </div>
          )}
          <div className="absolute top-4 left-4">
            <CountdownPill days={property.daysUntilPublic} />
          </div>
        </div>
      </Link>

      <div className="absolute top-4 right-4">
        <LikeButton propertyId={property.id} size="sm" variant="overlay" />
      </div>

      <div className="p-5">
        {property.suburb && (
          <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1.5 truncate">
            {property.suburb}
            {property.state ? `, ${property.state}` : ''}
          </div>
        )}
        <div className="text-base font-semibold text-slate-900 truncate mb-2">
          {property.address}
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 mb-4">
          {formatPrice(property.price)}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
          {property.bedrooms != null && (
            <span className="inline-flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-slate-400" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="inline-flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-slate-400" />
              {property.bathrooms}
            </span>
          )}
          {property.carSpaces != null && (
            <span className="inline-flex items-center gap-1.5">
              <Car className="w-4 h-4 text-slate-400" />
              {property.carSpaces}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function EarlyAccessPage() {
  const [data, setData] = useState({ properties: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/buyer/early-access');
        if (!res.ok) throw new Error('Failed to load early access');
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error('Early access load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { properties, meta } = data;

  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Members only
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-2">
          Early access
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Homes you can see before they hit the public market — handpicked from
          your watched areas and matched to your budget.
        </p>
      </motion.div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-slate-100" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-slate-100 rounded w-24" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-6 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && properties.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-orange-600" strokeWidth={2.25} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            No early access matches yet
          </h3>
          <p className="text-base text-slate-600 mb-8 max-w-md mx-auto">
            {meta?.watchedSuburbCount === 0
              ? 'Add a watched area so we can find pre-market homes for you.'
              : "We'll surface homes here as soon as agents add them in your areas."}
          </p>
          <Link
            href="/buyer-dashboard/areas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all"
          >
            Manage watched areas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {!loading && properties.length > 0 && (
        <>
          <div className="mb-6 flex items-center justify-between text-sm text-slate-500">
            <span>
              <span className="font-semibold text-slate-900">{properties.length}</span>{' '}
              {properties.length === 1 ? 'home' : 'homes'} matching your profile
            </span>
            {meta?.watchedSuburbCount > 0 && (
              <Link
                href="/buyer-dashboard/areas"
                className="font-semibold text-orange-600 hover:text-orange-700"
              >
                Edit areas →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p, i) => (
              <EarlyAccessCard key={p.id} property={p} delay={i * 0.04} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
