'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Heart,
  MapPin,
  Sparkles,
  Gauge,
  ArrowRight,
  Activity,
  Clock,
  Lock,
  Eye,
  Bell,
} from 'lucide-react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/clientApp';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../utils/authFetch';
import StatCard from './components/StatCard';
import BuyerPropertyCard from './components/BuyerPropertyCard';
import { useBuyerData } from './hooks/useBuyerData';

function formatPrice(price) {
  if (!price) return 'Price on request';
  const n = Number(price);
  if (Number.isNaN(n)) return price;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

function timeAgo(ms) {
  if (!ms) return 'just now';
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// Fields the buyer can fill in to "complete" their profile
const PROFILE_FIELDS = [
  { key: 'buyerTypes', label: 'Buyer type' },
  { key: 'budgetMax', label: 'Budget' },
  { key: 'propertyTypes', label: 'Property type' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'preApprovalStatus', label: 'Pre-approval' },
];

function calcCompleteness(profile) {
  if (!profile) return 0;
  let filled = 0;
  for (const f of PROFILE_FIELDS) {
    const v = profile[f.key];
    if (Array.isArray(v) ? v.length > 0 : v && v !== 'none') filled++;
  }
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

export default function BuyerOverviewPage() {
  const { user, userData } = useAuth();
  const {
    likedProperties,
    watchedAreas,
    loading: buyerLoading,
  } = useBuyerData();

  const [areaScores, setAreaScores] = useState({});
  const [recommended, setRecommended] = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [earlyAccess, setEarlyAccess] = useState({ properties: [], meta: null });
  const [earlyLoading, setEarlyLoading] = useState(true);

  // Fetch PHI for each watched area
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
          console.error('phi-scores error:', err);
        }
      }
      if (!cancelled) setAreaScores(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [watchedAreas]);

  // Fetch the activity feed
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/buyer/feed');
        if (!res.ok) throw new Error('feed failed');
        const data = await res.json();
        if (!cancelled) setFeed(data.events || []);
      } catch (err) {
        console.error('feed error:', err);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch the early access teaser
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/buyer/early-access');
        if (!res.ok) throw new Error('early access failed');
        const data = await res.json();
        if (!cancelled) setEarlyAccess(data);
      } catch (err) {
        console.error('early access error:', err);
      } finally {
        if (!cancelled) setEarlyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch recommended properties (client-side filter against profile)
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingRec(true);
      try {
        const profile = userData?.buyerProfile || {};
        const suburbs = watchedAreas
          .map((a) => a.suburb)
          .filter(Boolean)
          .slice(0, 10);

        const q = query(
          collection(db, 'properties'),
          where('active', '==', true),
          orderBy('createdAt', 'desc'),
          limit(24)
        );
        const snap = await getDocs(q);
        let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (suburbs.length) {
          const suburbLowerSet = new Set(
            suburbs.map((s) => String(s).toLowerCase())
          );
          rows = rows.filter((p) => {
            const sub = String(p.suburb || p.address || '').toLowerCase();
            return Array.from(suburbLowerSet).some((s) => sub.includes(s));
          });
        }

        if (profile.propertyTypes?.length) {
          rows = rows.filter(
            (p) =>
              !p.propertyType ||
              profile.propertyTypes.includes(p.propertyType)
          );
        }
        if (profile.budgetMax) {
          rows = rows.filter(
            (p) => !p.price || Number(p.price) <= Number(profile.budgetMax) * 1.1
          );
        }
        if (profile.budgetMin) {
          rows = rows.filter(
            (p) => !p.price || Number(p.price) >= Number(profile.budgetMin) * 0.9
          );
        }

        setRecommended(rows.slice(0, 6));
      } catch (err) {
        console.error('recommended fetch error:', err);
      } finally {
        setLoadingRec(false);
      }
    })();
  }, [user, userData, watchedAreas]);

  const completeness = useMemo(
    () => calcCompleteness(userData?.buyerProfile),
    [userData]
  );

  const stats = useMemo(() => {
    const mhiValues = Object.values(areaScores)
      .map((s) => s?.phi?.mhi ?? s?.mhi)
      .filter((v) => typeof v === 'number');
    const avgMhi =
      mhiValues.length > 0
        ? Math.round(mhiValues.reduce((a, b) => a + b, 0) / mhiValues.length)
        : null;
    return {
      liked: likedProperties.length,
      areas: watchedAreas.length,
      earlyAccess: earlyAccess.properties.length,
      avgMhi,
    };
  }, [likedProperties, watchedAreas, earlyAccess, areaScores]);

  const hasNothing =
    !buyerLoading && likedProperties.length === 0 && watchedAreas.length === 0;

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-2">
          Hi{userData?.firstName ? `, ${userData.firstName}` : ' there'}{' '}
          <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-lg text-slate-600">
          Here&apos;s what&apos;s happening in your property world.
        </p>
      </motion.div>

      {/* Early access hero — the moat */}
      {!earlyLoading && earlyAccess.properties.length > 0 && (
        <EarlyAccessHero
          properties={earlyAccess.properties.slice(0, 4)}
          total={earlyAccess.properties.length}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-10">
        <StatCard label="Liked" value={stats.liked} icon={Heart} accent="orange" delay={0} />
        <StatCard label="Watched Areas" value={stats.areas} icon={MapPin} accent="blue" delay={0.05} />
        <StatCard
          label="Early Access"
          value={stats.earlyAccess}
          sub="Pre-market homes"
          icon={Sparkles}
          accent="violet"
          delay={0.1}
        />
        <StatCard
          label="Avg Health"
          value={stats.avgMhi != null ? stats.avgMhi : '—'}
          sub="Across watched areas"
          icon={Gauge}
          accent="emerald"
          delay={0.15}
        />
      </div>

      {hasNothing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12 rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border border-orange-100 p-8 sm:p-10"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">
                Let&apos;s set up your profile
              </h3>
              <p className="text-slate-600">
                Tell us your budget, watched areas, and goals — we&apos;ll do the rest.
              </p>
            </div>
          </div>
          <Link
            href="/buyer-dashboard/welcome"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Two column: Activity feed | Profile completeness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Activity feed */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-slate-900">Recent activity</h2>
            </div>
            <Link
              href="/buyer-dashboard/liked"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              See all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {feedLoading && feed.length === 0 && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!feedLoading && feed.length === 0 && (
            <div className="py-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Bell className="w-7 h-7" />
              </div>
              <p className="text-sm text-slate-500">
                No activity yet. Add a watched area or like a property to start seeing updates.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {feed.slice(0, 8).map((event, i) => (
              <FeedRow key={event.id} event={event} delay={i * 0.04} />
            ))}
          </div>
        </motion.section>

        {/* Profile completeness ring */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-gradient-to-br from-violet-50 via-white to-violet-50/50 border border-violet-100 rounded-3xl p-6 sm:p-7 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-1">Your profile</h3>
          <p className="text-xs text-slate-500 mb-5">
            A complete profile means better matches.
          </p>

          <div className="flex items-center justify-center mb-5">
            <CompletenessRing percent={completeness} />
          </div>

          <div className="space-y-2 mb-5">
            {PROFILE_FIELDS.map((f) => {
              const v = userData?.buyerProfile?.[f.key];
              const filled = Array.isArray(v) ? v.length > 0 : v && v !== 'none';
              return (
                <div
                  key={f.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      filled ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    {filled && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <span
                    className={`${
                      filled ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {f.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Link
            href="/buyer-dashboard/settings"
            className="block w-full text-center px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold rounded-2xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
          >
            {completeness === 100 ? 'Edit profile' : 'Complete profile'}
          </Link>
        </motion.section>
      </div>

      {/* Areas at a glance */}
      {watchedAreas.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-14"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Your areas
            </h2>
            <Link
              href="/buyer-dashboard/areas"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              Manage
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {watchedAreas.map((area, i) => {
              const score = areaScores[area.id];
              const phi = score?.phi || score || {};
              return (
                <motion.div
                  key={area.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.05 }}
                >
                  <Link
                    href={`/buyer-dashboard/insights?area=${area.id}`}
                    className="group block bg-white border border-slate-200 rounded-3xl p-6 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                        <MapPin className="w-5 h-5" strokeWidth={2.25} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-bold text-slate-900 truncate">
                          {area.name || area.suburb || 'Area'}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {area.placeName}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Pill label="Health" value={phi.mhi} />
                      <Pill label="Demand" value={phi.bdi} />
                      <Pill label="Supply" value={phi.sdb} />
                      <Pill label="Price" value={phi.fpi} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Recommended */}
      {recommended.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-14"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
                Recommended for you
              </h2>
              <p className="text-sm text-slate-600">
                Hand-picked from your watched areas
              </p>
            </div>
            <Link
              href="/listings"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              Browse all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommended.map((p, i) => (
              <BuyerPropertyCard key={p.id} property={p} delay={0.05 * i} />
            ))}
          </div>
        </motion.section>
      )}

      {loadingRec && recommended.length === 0 && (
        <div className="text-sm text-slate-400">Loading recommendations…</div>
      )}
    </div>
  );
}

function EarlyAccessHero({ properties, total }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="mb-10 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 border border-orange-500/20 p-6 sm:p-8 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Members only
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              {total} early access {total === 1 ? 'home' : 'homes'} for you
            </h2>
            <p className="text-base text-slate-300 max-w-xl">
              Pre-market properties matched to your profile. Get in before the crowd.
            </p>
          </div>
          <Link
            href="/buyer-dashboard/early-access"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-orange-50 hover:shadow-xl transition-all flex-shrink-0"
          >
            See all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {properties.map((p, i) => (
            <Link
              key={p.id}
              href={`/find-property?propertyId=${p.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-orange-400/40 hover:bg-white/10 transition-all"
              >
                <div className="relative aspect-[4/3] bg-slate-800">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.address}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <MapPin className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    {p.daysUntilPublic == null ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/90 backdrop-blur-sm text-white text-[10px] font-bold">
                        <Lock className="w-2.5 h-2.5" />
                        Pre-market
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/90 backdrop-blur-sm text-white text-[10px] font-bold">
                        <Clock className="w-2.5 h-2.5" />
                        {p.daysUntilPublic}d
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[11px] text-orange-300 font-semibold uppercase tracking-wider truncate mb-1">
                    {p.suburb || 'Pre-market'}
                  </div>
                  <div className="text-sm font-bold text-white truncate mb-1">
                    {p.address}
                  </div>
                  <div className="text-base font-bold text-orange-300">
                    {formatPrice(p.price)}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

const FEED_ICONS = {
  new_listing: Activity,
  new_premarket: Sparkles,
  updated: Eye,
  opinion: Heart,
};

const FEED_TONES = {
  new_listing: 'bg-blue-100 text-blue-600',
  new_premarket: 'bg-orange-100 text-orange-600',
  updated: 'bg-violet-100 text-violet-600',
  opinion: 'bg-rose-100 text-rose-600',
};

function FeedRow({ event, delay }) {
  const Icon = FEED_ICONS[event.type] || Activity;
  const tone = FEED_TONES[event.type] || 'bg-slate-100 text-slate-600';
  const href = event.propertyId
    ? `/find-property?propertyId=${event.propertyId}`
    : '#';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors group"
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${tone}`}>
          <Icon className="w-5 h-5" strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {event.title}
            </span>
            {event.inWatchedArea && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                Watched
              </span>
            )}
            {event.isLiked && (
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500 flex-shrink-0" />
            )}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {event.propertyAddress || event.suburb || 'Property'}
            {event.price && ` · ${formatPrice(event.price)}`}
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium flex-shrink-0">
          {timeAgo(event.timestamp)}
        </div>
      </Link>
    </motion.div>
  );
}

function CompletenessRing({ percent }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-[140px] h-[140px]">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="10"
          fill="none"
          className="stroke-violet-100"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          className="stroke-violet-500"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-slate-900">{percent}%</div>
        <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
          Complete
        </div>
      </div>
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
