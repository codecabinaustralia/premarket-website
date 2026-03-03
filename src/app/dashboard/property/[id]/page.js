'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/clientApp';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageSquare,
  Users,
  TrendingUp,
  Home,
  Bed,
  Bath,
  Car,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Trash2,
  BarChart3,
  PieChart,
  Clock,
  DollarSign,
  UserCheck,
  UserX,
} from 'lucide-react';

function formatPrice(price) {
  if (!price) return '--';
  const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '--';
  return '$' + num.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

function formatDate(ts) {
  if (!ts) return '--';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// --- Engagement Stat Card ---
function EngagementCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl p-5 bg-white border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-slate-500" />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-xs font-medium text-slate-500 mt-1">{label}</div>
    </div>
  );
}

// --- Median Price Card ---
function MedianCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-900">{value ? formatPrice(value) : '--'}</div>
    </div>
  );
}

// --- Image Gallery ---
function ImageGallery({ images }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 sm:h-80 bg-slate-100 rounded-xl flex items-center justify-center">
        <Home className="w-16 h-16 text-slate-300" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-slate-100">
      <Image
        src={images[current]}
        alt={`Property image ${current + 1}`}
        fill
        className="object-cover"
        unoptimized
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 rounded-lg text-white text-xs font-medium">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}

// --- Price Distribution Bar ---
function PriceDistribution({ opinions }) {
  const amounts = opinions
    .map(o => parseFloat(o.offerAmount) || 0)
    .filter(a => a > 0)
    .sort((a, b) => a - b);

  if (amounts.length < 2) return null;

  const min = amounts[0];
  const max = amounts[amounts.length - 1];
  const range = max - min;
  if (range === 0) return null;

  // Create 5 buckets
  const bucketSize = range / 5;
  const buckets = Array(5).fill(0);
  amounts.forEach(a => {
    const idx = Math.min(Math.floor((a - min) / bucketSize), 4);
    buckets[idx]++;
  });
  const maxCount = Math.max(...buckets);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-slate-500" />
        Price Distribution
      </h3>
      <div className="space-y-2">
        {buckets.map((count, i) => {
          const bucketMin = min + i * bucketSize;
          const bucketMax = min + (i + 1) * bucketSize;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-32 text-right shrink-0">
                {formatPrice(bucketMin)} - {formatPrice(bucketMax)}
              </span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full bg-slate-800 rounded-full"
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Buyer Breakdown ---
function BuyerBreakdown({ seriousBuyers, passiveBuyers, opinions }) {
  const total = opinions.length;
  if (total === 0) return null;

  const seriousPct = Math.round((seriousBuyers.length / total) * 100);
  const passivePct = 100 - seriousPct;
  const fhbCount = opinions.filter(o => o.isFirstHomeBuyer).length;
  const investorCount = opinions.filter(o => o.isInvestor).length;

  // Seriousness distribution
  const seriousnessLevels = {};
  opinions.forEach(o => {
    const level = o.seriousnessLevel || 'Unknown';
    seriousnessLevels[level] = (seriousnessLevels[level] || 0) + 1;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <PieChart className="w-4 h-4 text-slate-500" />
        Buyer Breakdown
      </h3>

      {/* Serious vs Passive bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-900 font-semibold">Serious ({seriousBuyers.length})</span>
          <span className="text-slate-500 font-semibold">Passive ({passiveBuyers.length})</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${seriousPct}%` }}
            transition={{ duration: 0.8 }}
            className="bg-slate-800 rounded-l-full"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${passivePct}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-slate-300 rounded-r-full"
          />
        </div>
      </div>

      {/* Buyer Type Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">{fhbCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">First Home Buyers</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">{investorCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Investors</div>
        </div>
      </div>

      {/* Seriousness Distribution */}
      {Object.keys(seriousnessLevels).length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-2">Seriousness Levels</p>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(seriousnessLevels)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([level, count]) => (
                <span key={level} className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                  Level {level}: {count}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Opinions Table ---
function OpinionsTable({ opinions }) {
  const [sortField, setSortField] = useState('offerAmount');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    return [...opinions].sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'offerAmount') {
        aVal = parseFloat(a.offerAmount) || 0;
        bVal = parseFloat(b.offerAmount) || 0;
      } else if (sortField === 'serious') {
        aVal = a.serious ? 1 : 0;
        bVal = b.serious ? 1 : 0;
      } else if (sortField === 'seriousnessLevel') {
        aVal = a.seriousnessLevel || 0;
        bVal = b.seriousnessLevel || 0;
      } else {
        aVal = a[sortField] || '';
        bVal = b[sortField] || '';
      }
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [opinions, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  if (opinions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">No buyer opinions yet</p>
      </div>
    );
  }

  const SortHeader = ({ field, children }) => (
    <th
      onClick={() => toggleSort(field)}
      className="text-left px-4 py-3 font-semibold text-slate-600 cursor-pointer hover:text-slate-900 select-none"
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-xs">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Buyer Opinions ({opinions.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <SortHeader field="buyerName">Buyer</SortHeader>
              <SortHeader field="offerAmount">Price Opinion</SortHeader>
              <SortHeader field="serious">Type</SortHeader>
              <SortHeader field="seriousnessLevel">Seriousness</SortHeader>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Badges</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((op) => (
              <tr
                key={op.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {op.buyerName || op.userName || 'Anonymous'}
                </td>
                <td className="px-4 py-3 text-slate-700 font-semibold">
                  {formatPrice(op.offerAmount)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    op.serious
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {op.serious ? 'Serious' : 'Passive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {op.seriousnessLevel || '--'}
                </td>
                <td className="px-4 py-3 space-x-1">
                  {op.isFirstHomeBuyer && (
                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">FHB</span>
                  )}
                  {op.isInvestor && (
                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">Investor</span>
                  )}
                  {!op.isFirstHomeBuyer && !op.isInvestor && (
                    <span className="text-slate-400">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Main Report Page ---
export default function PropertyReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id;

  const [property, setProperty] = useState(null);
  const [offers, setOffers] = useState([]);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/join');
    }
  }, [user, authLoading, router]);

  // Fetch property + offers + likes
  useEffect(() => {
    if (!user || !propertyId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [propertySnap, offersSnap, likesSnap] = await Promise.all([
          getDoc(doc(db, 'properties', propertyId)),
          getDocs(query(collection(db, 'offers'), where('propertyId', '==', propertyId))),
          getDocs(query(collection(db, 'likes'), where('propertyId', '==', propertyId))),
        ]);

        if (propertySnap.exists()) {
          const propData = { id: propertySnap.id, ...propertySnap.data() };
          // Verify ownership
          if (propData.userId !== user.uid) {
            router.push('/dashboard');
            return;
          }
          setProperty(propData);
        } else {
          router.push('/dashboard');
          return;
        }

        setOffers(offersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLikes(likesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, propertyId, router]);

  const toggleVisibility = async () => {
    if (!property) return;
    setToggling(true);
    try {
      const newVisibility = !property.visibility;
      await updateDoc(doc(db, 'properties', property.id), { visibility: newVisibility });
      setProperty(prev => ({ ...prev, visibility: newVisibility }));
    } catch (err) {
      console.error('Error toggling visibility:', err);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!property) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'properties', property.id));
      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting property:', err);
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (!user || !property) return null;

  // Computed data
  const opinions = offers.filter(o => o.type === 'opinion');
  const seriousBuyers = opinions.filter(o => o.serious === true);
  const passiveBuyers = opinions.filter(o => o.serious !== true);

  const seriousAmounts = seriousBuyers.map(o => parseFloat(o.offerAmount) || 0).filter(a => a > 0);
  const passiveAmounts = passiveBuyers.map(o => parseFloat(o.offerAmount) || 0).filter(a => a > 0);
  const allAmounts = [...seriousAmounts, ...passiveAmounts];

  const listingPrice = parseFloat(String(property.price).replace(/[^0-9.]/g, '')) || 0;
  const combinedMedian = median(allAmounts);
  const priceDiff = combinedMedian && listingPrice
    ? ((combinedMedian - listingPrice) / listingPrice * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 truncate">Property Report</h1>
              <p className="text-xs text-slate-500 truncate">{property.formattedAddress || property.address || 'Property'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVisibility}
              disabled={toggling}
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                property.visibility
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {property.visibility ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {property.visibility ? 'Live' : 'Draft'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Property Header */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Image Gallery */}
          <div className="lg:col-span-3">
            <ImageGallery images={property.imageUrls} />
          </div>

          {/* Property Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                  property.visibility
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {property.visibility ? 'Live' : 'Draft'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {property.title || property.formattedAddress || property.address || 'Property'}
              </h2>
              <p className="text-sm text-slate-500 mb-3">{property.formattedAddress || property.address}</p>
              <p className="text-2xl font-bold text-slate-900 mb-4">{formatPrice(property.price)}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600">
              {property.bedrooms != null && (
                <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-slate-400" />{property.bedrooms} Bed</span>
              )}
              {property.bathrooms != null && (
                <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-slate-400" />{property.bathrooms} Bath</span>
              )}
              {property.carSpaces != null && (
                <span className="flex items-center gap-1.5"><Car className="w-4 h-4 text-slate-400" />{property.carSpaces} Car</span>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={toggleVisibility}
                disabled={toggling}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                {property.visibility ? 'Set to Draft' : 'Go Live'}
              </button>
            </div>
          </div>
        </div>

        {/* Engagement Overview */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">Engagement</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <EngagementCard label="Total Views" value={property.stats?.views || 0} icon={Eye} />
            <EngagementCard label="Total Likes" value={likes.length} icon={Heart} />
            <EngagementCard label="Price Opinions" value={opinions.length} icon={MessageSquare} />
            <EngagementCard label="Serious Buyers" value={seriousBuyers.length} icon={UserCheck} />
          </div>
        </div>

        {/* Price Intelligence */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">Price Intelligence</h3>

          {/* Listing vs Median comparison */}
          {listingPrice > 0 && combinedMedian > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Listing Price</p>
                  <p className="text-2xl font-bold text-slate-900">{formatPrice(listingPrice)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-1">vs Median Opinion</p>
                  <p className={`text-lg font-bold ${
                    priceDiff > 0 ? 'text-slate-900' : priceDiff < 0 ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    {priceDiff > 0 ? '+' : ''}{priceDiff}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Combined Median</p>
                  <p className="text-2xl font-bold text-slate-900">{formatPrice(combinedMedian)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <MedianCard label="Serious Buyer Median" value={median(seriousAmounts)} />
            <MedianCard label="Passive Buyer Median" value={median(passiveAmounts)} />
            <MedianCard label="Combined Median" value={median(allAmounts)} />
          </div>

          {/* Price Range */}
          {allAmounts.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Lowest Opinion</p>
                <p className="text-sm font-bold text-slate-900">{formatPrice(Math.min(...allAmounts))}</p>
              </div>
              <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-slate-300 via-slate-500 to-slate-800 rounded-full" />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Highest Opinion</p>
                <p className="text-sm font-bold text-slate-900">{formatPrice(Math.max(...allAmounts))}</p>
              </div>
            </div>
          )}
        </div>

        {/* Price Distribution + Buyer Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceDistribution opinions={opinions} />
          <BuyerBreakdown
            seriousBuyers={seriousBuyers}
            passiveBuyers={passiveBuyers}
            opinions={opinions}
          />
        </div>

        {/* Opinions Table */}
        <OpinionsTable opinions={opinions} />
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Property</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure? This action cannot be undone. All data associated with this property will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
