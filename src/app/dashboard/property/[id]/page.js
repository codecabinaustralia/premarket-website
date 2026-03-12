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
  Link2,
  Check,
  ExternalLink,
  Video,
  Upload,
  Pencil,
  Archive,
  Send,
  FileText,
  Mail,
  X,
  MoreVertical,
  Tablet,
  Copy,
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

// --- Media Gallery (Video + Images combined) ---
function MediaGallery({ images, videoUrl, onVideoUpload, onVideoDrop, onVideoRemove, uploadingVideo, videoDragging, setVideoDragging, mediaError, setMediaError }) {
  const [current, setCurrent] = useState(0);
  const hasVideo = !!videoUrl;
  const imageList = images || [];
  // Video is slide 0 (or upload prompt if no video), images follow
  const totalSlides = imageList.length + 1; // +1 for video/upload slot
  const isVideoSlide = current === 0;

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-slate-100">
      {/* Video slide */}
      {isVideoSlide && (
        <div className="w-full">
          {hasVideo ? (
            <div className="relative bg-black group">
              <video
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                poster={imageList[0]}
                className="w-full rounded-xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="flex items-center justify-center py-12 text-white/60 text-sm">Video unavailable</div>';
                }}
              />
              <div className="absolute top-3 right-12 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer px-3 py-1.5 bg-white/90 backdrop-blur-sm text-slate-700 rounded-lg text-xs font-semibold hover:bg-white transition-colors">
                  Replace
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
                    onChange={onVideoUpload}
                    className="hidden"
                    disabled={uploadingVideo}
                  />
                </label>
                <button
                  onClick={onVideoRemove}
                  className="px-3 py-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { if (!uploadingVideo) { e.preventDefault(); setVideoDragging(true); } }}
              onDragLeave={() => setVideoDragging(false)}
              onDrop={onVideoDrop}
              onClick={() => { if (!uploadingVideo) document.getElementById('property-video-upload').click(); }}
              className={`cursor-pointer h-64 sm:h-80 flex flex-col items-center justify-center transition-all ${uploadingVideo ? 'opacity-50 pointer-events-none' : videoDragging ? 'bg-orange-50' : 'hover:bg-orange-50'}`}
            >
              {uploadingVideo ? (
                <>
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-900">Uploading video...</p>
                </>
              ) : (
                <>
                  <Video className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-900 mb-1">Click or drag to add video</p>
                  <p className="text-xs text-slate-500">MP4, MOV, WebM, M4V up to 500MB</p>
                </>
              )}
              <input
                type="file"
                id="property-video-upload"
                accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
                onChange={onVideoUpload}
                className="hidden"
                disabled={uploadingVideo}
              />
            </div>
          )}
        </div>
      )}

      {/* Image slides */}
      {!isVideoSlide && imageList.length > 0 && (
        <div className="relative w-full h-64 sm:h-80">
          <Image
            src={imageList[current - 1]}
            alt={`Property image ${current}`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Empty state when no images and on an image slide */}
      {!isVideoSlide && imageList.length === 0 && (
        <div className="w-full h-64 sm:h-80 flex items-center justify-center">
          <Home className="w-16 h-16 text-slate-300" />
        </div>
      )}

      {/* Navigation arrows */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + totalSlides) % totalSlides)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % totalSlides)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {Array.from({ length: totalSlides }).map((_, i) => (
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

      {/* Slide counter + label */}
      <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 rounded-lg text-white text-xs font-medium z-10">
        {isVideoSlide ? (hasVideo ? 'Video' : 'Add Video') : `${current} / ${imageList.length}`}
      </div>

      {/* Media error banner */}
      {mediaError && (
        <div className="absolute bottom-12 left-3 right-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between z-10">
          <p className="text-sm text-red-600">{mediaError}</p>
          <button onClick={() => setMediaError(null)}>
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}
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
  const [copied, setCopied] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoDragging, setVideoDragging] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [showSendReport, setShowSendReport] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportEmail, setReportEmail] = useState('');
  const [reportName, setReportName] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  const validateVideoFile = (file) => {
    const allowedVideoExts = ['.mp4', '.mov', '.webm', '.m4v'];
    const ext = (file.name || '').toLowerCase().replace(/.*(\.\w+)$/, '$1');
    if (file.size > 500 * 1024 * 1024) {
      setMediaError('Video file exceeds 500MB limit. Please choose a smaller file.');
      return false;
    }
    if (!allowedVideoExts.includes(ext)) {
      setMediaError(`Unsupported video format "${ext}". Please use MP4, MOV, WebM, or M4V.`);
      return false;
    }
    setMediaError(null);
    return true;
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !property) return;
    if (!validateVideoFile(file)) return;
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      await updateDoc(doc(db, 'properties', property.id), { videoUrl: data.url });
      setProperty(prev => ({ ...prev, videoUrl: data.url }));
    } catch (err) {
      console.error('Video upload error:', err);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setVideoDragging(false);
    const allowedVideoExts = ['.mp4', '.mov', '.webm', '.m4v'];
    const file = Array.from(e.dataTransfer.files).find(f => {
      const ext = (f.name || '').toLowerCase().replace(/.*(\.\w+)$/, '$1');
      return f.type.startsWith('video/') || allowedVideoExts.includes(ext);
    });
    if (!file || !property) return;
    if (!validateVideoFile(file)) return;
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      await updateDoc(doc(db, 'properties', property.id), { videoUrl: data.url });
      setProperty(prev => ({ ...prev, videoUrl: data.url }));
    } catch (err) {
      console.error('Video upload error:', err);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (!property) return;
    try {
      await updateDoc(doc(db, 'properties', property.id), { videoUrl: null });
      setProperty(prev => ({ ...prev, videoUrl: null }));
    } catch (err) {
      console.error('Error removing video:', err);
    }
  };

  const handleArchive = async () => {
    if (!property) return;
    setArchiving(true);
    try {
      if (property.archived) {
        await updateDoc(doc(db, 'properties', property.id), { archived: false });
        setProperty(prev => ({ ...prev, archived: false }));
      } else {
        await updateDoc(doc(db, 'properties', property.id), { archived: true, visibility: false });
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error archiving property:', err);
    } finally {
      setArchiving(false);
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

  const propertyUrl = `https://premarket.homes/find-property?propertyId=${property.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = propertyUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-900 truncate">{property.title || 'Property Report'}</h1>
                <p className="text-xs text-slate-500 truncate">{property.formattedAddress || property.address}</p>
              </div>
            </div>

            {/* Right: Key actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Visibility toggle */}
              <button
                onClick={toggleVisibility}
                disabled={toggling}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  property.visibility
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {property.visibility ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Public
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Private
                  </>
                )}
              </button>

              {/* Send Report - primary action */}
              <button
                onClick={() => { setShowSendReport(true); setReportSent(false); setReportEmail(''); setReportName(''); }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Send Report
              </button>

              {/* More menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                >
                  <MoreVertical className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">Settings</span>
                </button>

                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20">
                      {/* Copy Link */}
                      <button
                        onClick={() => { copyLink(); setShowMoreMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                      {/* Preview */}
                      <a
                        href={propertyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowMoreMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                        Preview Listing
                      </a>
                      {/* iPad mode */}
                      <a
                        href={`/find-property?propertyId=${property.id}&mode=ipad`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowMoreMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Tablet className="w-4 h-4 text-slate-400" />
                        Open Home (iPad)
                      </a>
                      <div className="border-t border-slate-100 my-1.5" />
                      {/* Edit */}
                      <Link
                        href={`/dashboard/edit/${property.id}`}
                        onClick={() => setShowMoreMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-slate-400" />
                        Edit Property
                      </Link>
                      {/* Send Report - mobile */}
                      <button
                        onClick={() => { setShowSendReport(true); setReportSent(false); setReportEmail(''); setReportName(''); setShowMoreMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors sm:hidden"
                      >
                        <Send className="w-4 h-4 text-slate-400" />
                        Send Report
                      </button>
                      {/* Archive */}
                      <button
                        onClick={() => { handleArchive(); setShowMoreMenu(false); }}
                        disabled={archiving}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        <Archive className="w-4 h-4 text-slate-400" />
                        {property.archived ? 'Unarchive' : 'Archive'}
                      </button>
                      <div className="border-t border-slate-100 my-1.5" />
                      {/* Delete */}
                      <button
                        onClick={() => { setShowDeleteConfirm(true); setShowMoreMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Property
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Property Header */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Media Gallery (Video + Images) */}
          <div className="lg:col-span-3">
            <MediaGallery
              images={property.imageUrls}
              videoUrl={property.aiVideo?.url || property.videoUrl}
              onVideoUpload={handleVideoUpload}
              onVideoDrop={handleVideoDrop}
              onVideoRemove={handleRemoveVideo}
              uploadingVideo={uploadingVideo}
              videoDragging={videoDragging}
              setVideoDragging={setVideoDragging}
              mediaError={mediaError}
              setMediaError={setMediaError}
            />
          </div>

          {/* Property Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                  property.archived
                    ? 'bg-amber-100 text-amber-700'
                    : property.visibility
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                }`}>
                  {property.archived ? 'Archived' : property.visibility ? 'Public' : 'Private'}
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

      {/* Send Report Modal */}
      <AnimatePresence>
        {showSendReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !sendingReport && setShowSendReport(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              {reportSent ? (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-7 h-7 text-green-500" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Report Sent!</h3>
                  <p className="text-sm text-slate-500 mb-5">The report has been emailed to {reportEmail}</p>
                  <button
                    onClick={() => setShowSendReport(false)}
                    className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowSendReport(false)}
                    className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 text-center mb-1">Send Report</h3>
                  <p className="text-sm text-slate-500 text-center mb-5">Email a PDF report with property insights and buyer data.</p>
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Recipient Name</label>
                      <input
                        type="text"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        placeholder="e.g. John Smith"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={reportEmail}
                        onChange={(e) => setReportEmail(e.target.value)}
                        placeholder="e.g. john@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSendReport(false)}
                      disabled={sendingReport}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!reportEmail) return;
                        setSendingReport(true);
                        try {
                          const res = await fetch('/api/send-report', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: reportEmail, name: reportName, propertyId: property.id }),
                          });
                          if (!res.ok) throw new Error('Failed to send');
                          setReportSent(true);
                        } catch (err) {
                          console.error('Error sending report:', err);
                          alert('Failed to send report. Please try again.');
                        } finally {
                          setSendingReport(false);
                        }
                      }}
                      disabled={sendingReport || !reportEmail}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendingReport ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
