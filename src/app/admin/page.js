'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { db } from '../firebase/clientApp';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const ADMIN_PASSWORD = 'ShinyBrew!23';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrice(price) {
  if (!price) return '—';
  const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '—';
  return '$' + num.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Password Gate ──────────────────────────────────────────────────────────

function PasswordGate({ onAuth }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      onAuth();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600 rounded-full blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Enter password to continue</p>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                error ? 'border-red-500 shake' : 'border-white/20'
              }`}
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">Incorrect password</p>
            )}
            <button
              type="submit"
              className="w-full mt-4 py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Report Card Modal ──────────────────────────────────────────────────────

function ReportModal({ property, onClose }) {
  const [offers, setOffers] = useState([]);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const [offersSnap, likesSnap] = await Promise.all([
          getDocs(query(collection(db, 'offers'), where('propertyId', '==', property.id))),
          getDocs(query(collection(db, 'likes'), where('propertyId', '==', property.id))),
        ]);
        setOffers(offersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLikes(likesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [property.id]);

  const opinions = offers.filter(o => o.type === 'opinion');
  const seriousBuyers = opinions.filter(o => o.serious === true);
  const passiveBuyers = opinions.filter(o => o.serious !== true);

  const seriousAmounts = seriousBuyers.map(o => parseFloat(o.offerAmount) || 0).filter(a => a > 0);
  const passiveAmounts = passiveBuyers.map(o => parseFloat(o.offerAmount) || 0).filter(a => a > 0);
  const allAmounts = [...seriousAmounts, ...passiveAmounts];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Prospect Report</h2>
            <p className="text-sm text-slate-500 truncate max-w-md">{property.address || 'No address'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Views" value={property.stats?.views || 0} color="blue" />
              <StatCard label="Total Likes" value={likes.length} color="pink" />
              <StatCard label="Serious Buyers" value={seriousBuyers.length} color="emerald" />
              <StatCard label="Passive Buyers" value={passiveBuyers.length} color="slate" />
            </div>

            {/* Median Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MedianCard label="Serious Median" value={median(seriousAmounts)} color="emerald" />
              <MedianCard label="Passive Median" value={median(passiveAmounts)} color="slate" />
              <MedianCard label="Combined Median" value={median(allAmounts)} color="orange" />
            </div>

            {/* Buyer Opinions Table */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Buyer Opinions ({opinions.length})</h3>
              {opinions.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-xl">No opinions yet</p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Buyer</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Offer</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Seriousness</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Badges</th>
                        </tr>
                      </thead>
                      <tbody>
                        {opinions.map((op) => (
                          <tr key={op.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {op.buyerName || op.userName || 'Anonymous'}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{formatPrice(op.offerAmount)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                op.serious
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {op.serious ? 'Serious' : 'Passive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{op.seriousnessLevel || '—'}</td>
                            <td className="px-4 py-3 space-x-1">
                              {op.isFirstHomeBuyer && (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">FHB</span>
                              )}
                              {op.isInvestor && (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">Investor</span>
                              )}
                              {!op.isFirstHomeBuyer && !op.isInvestor && (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    pink: 'bg-pink-50 text-pink-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color] || colors.slate}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-70 mt-1">{label}</div>
    </div>
  );
}

function MedianCard({ label, value, color }) {
  const colors = {
    emerald: 'border-emerald-200 bg-emerald-50',
    slate: 'border-slate-200 bg-slate-50',
    orange: 'border-orange-200 bg-orange-50',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.slate}`}>
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-900">{value ? formatPrice(value) : '—'}</div>
    </div>
  );
}

// ─── Property Card ──────────────────────────────────────────────────────────

function PropertyCard({ property, onViewReport }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative w-full sm:w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
        {property.imageUrls?.[0] ? (
          <Image
            src={property.imageUrls[0]}
            alt={property.address || 'Property'}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{property.address || 'No address'}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              {property.bedrooms != null && <span>{property.bedrooms} bed</span>}
              {property.bathrooms != null && <span>{property.bathrooms} bath</span>}
              {property.carSpaces != null && <span>{property.carSpaces} car</span>}
            </div>
          </div>
          <span className={`flex-shrink-0 inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
            property.visibility === true
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {property.visibility === true ? 'Live' : 'Draft'}
          </span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{formatPrice(property.price)}</span>
            <span>{formatDate(property.created || property.createdAt)}</span>
            <span>{property.stats?.views || 0} views</span>
          </div>
          <button
            onClick={() => onViewReport(property)}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
          >
            View Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Row ───────────────────────────────────────────────────────────────

function UserRow({ user, onSelect, isExpanded, properties, propertiesLoading, onViewReport }) {
  const liveCount = properties?.filter(p => p.visibility === true).length || 0;

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* User summary row */}
      <button
        onClick={onSelect}
        className={`w-full px-4 sm:px-6 py-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors ${
          isExpanded ? 'bg-slate-50' : ''
        }`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.firstName || ''}
              width={40}
              height={40}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {(user.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
            </div>
          )}
        </div>

        {/* Name & email */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name'}
          </p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
        </div>

        {/* Subscription badge */}
        <div className="hidden sm:flex items-center gap-2">
          {user.pro && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Pro</span>
          )}
          {user.agent && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Agent</span>
          )}
          {user.active === false && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-600">Inactive</span>
          )}
        </div>

        {/* Date */}
        <div className="hidden md:block text-xs text-slate-500 w-24 text-right">
          {formatDate(user.createdAt)}
        </div>

        {/* Property counts */}
        <div className="text-right w-20">
          <span className="text-sm font-semibold text-slate-700">{properties?.length ?? '—'}</span>
          <span className="text-xs text-slate-400 ml-1">props</span>
          {liveCount > 0 && (
            <div className="text-xs text-emerald-600 font-medium">{liveCount} live</div>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded properties */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-6 pb-4 pl-8 sm:pl-16 space-y-3">
              {propertiesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
                </div>
              ) : !properties || properties.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No properties</p>
              ) : (
                properties.map(p => (
                  <PropertyCard key={p.id} property={p} onViewReport={onViewReport} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Admin Dashboard ───────────────────────────────────────────────────

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userProperties, setUserProperties] = useState({});
  const [propertiesLoading, setPropertiesLoading] = useState({});
  const [reportProperty, setReportProperty] = useState(null);
  const [allProperties, setAllProperties] = useState([]);

  // Fetch all users and all properties on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersSnap, propsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'properties')),
        ]);

        const usersData = usersSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
          });

        const propsData = propsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Group properties by userId
        const propsByUser = {};
        propsData.forEach(p => {
          if (p.userId) {
            if (!propsByUser[p.userId]) propsByUser[p.userId] = [];
            propsByUser[p.userId].push(p);
          }
        });

        setUsers(usersData);
        setAllProperties(propsData);
        setUserProperties(propsByUser);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.companyName?.toLowerCase().includes(q)
    );
  }, [users, search]);

  // Stats
  const totalProperties = allProperties.length;
  const liveProperties = allProperties.filter(p => p.visibility === true).length;
  const totalOffers = '—'; // loaded lazily per property

  const handleExpandUser = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const stats = [
    { label: 'Total Users', value: users.length, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Properties', value: totalProperties, color: 'from-purple-500 to-purple-600' },
    { label: 'Live Properties', value: liveProperties, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Filtered Users', value: filteredUsers.length, color: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900">Premarket Admin</h1>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin_auth');
              window.location.reload();
            }}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${s.color} rounded-xl p-5 text-white shadow-lg`}
            >
              <div className="text-3xl font-bold">{loading ? '...' : s.value}</div>
              <div className="text-sm opacity-80 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or company..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600">
              Users ({filteredUsers.length})
            </h2>
            <span className="text-xs text-slate-400">Sorted by newest first</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                isExpanded={expandedUserId === user.id}
                onSelect={() => handleExpandUser(user.id)}
                properties={userProperties[user.id]}
                propertiesLoading={propertiesLoading[user.id]}
                onViewReport={(p) => setReportProperty(p)}
              />
            ))
          )}
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {reportProperty && (
          <ReportModal
            property={reportProperty}
            onClose={() => setReportProperty(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_auth');
    if (stored === 'true') setAuthed(true);
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (!authed) {
    return <PasswordGate onAuth={() => setAuthed(true)} />;
  }

  return <AdminDashboard />;
}
