'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/clientApp';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  ArrowLeft,
  Shield,
  Check,
  X,
  Trash2,
  Clock,
  ShieldCheck,
  ShieldX,
  Users,
  Key,
  Search,
  Home,
  BarChart3,
  FileText,
  Code,
  Eye,
  TrendingUp,
  Zap,
  Building2,
  LinkIcon,
  Copy,
  Play,
  Monitor,
  ExternalLink,
  ChevronRight,
  MousePointer,
  Type,
  Globe,
} from 'lucide-react';

function formatDate(ts) {
  if (!ts) return '--';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateWithTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function parseUserAgent(ua) {
  if (!ua) return null;
  let browser = 'Unknown';
  let os = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';
  return { browser, os };
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'properties', label: 'Properties', icon: Home },
  { key: 'api', label: 'API Requests', icon: Key },
  { key: 'docs-analytics', label: 'Docs Analytics', icon: LinkIcon },
  { key: 'dev-docs', label: 'Developer Docs', icon: Code },
];

export default function AdminDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/join');
      return;
    }
    if (!loading && userData && userData.superAdmin !== true) {
      router.push('/dashboard');
    }
  }, [user, userData, loading, router]);

  if (loading || !user || userData?.superAdmin !== true) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && <OverviewTab user={user} />}
        {activeTab === 'users' && <UsersTab user={user} />}
        {activeTab === 'properties' && <PropertiesTab user={user} />}
        {activeTab === 'api' && <ApiRequestsTab user={user} />}
        {activeTab === 'docs-analytics' && <DocsAnalyticsTab user={user} userData={userData} />}
        {activeTab === 'dev-docs' && <DeveloperDocsTab />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-5 ${colors[color] || colors.slate}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 opacity-60" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-70 mt-1">{label}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function OverviewTab({ user }) {
  const [data, setData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loadingState, setLoadingState] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, propertiesSnap] = await Promise.all([
          fetch(`/api/admin/users?adminUid=${user.uid}`),
          getDocs(collection(db, 'properties')),
        ]);
        const usersData = await usersRes.json();

        const allProperties = propertiesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.active !== false && p.archived !== true);

        setData(usersData);
        setProperties(allProperties);
      } catch (err) {
        console.error('Overview fetch error:', err);
      } finally {
        setLoadingState(false);
      }
    }
    fetchData();
  }, [user.uid]);

  if (loadingState) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  const users = data?.users || [];
  const activeCampaigns = properties.filter((p) => p.visibility === true).length;
  const apiApproved = users.filter((u) => u.apiAccess?.status === 'approved').length;
  const apiPending = users.filter((u) => u.apiAccess?.status === 'pending').length;
  const totalViews = properties.reduce((sum, p) => sum + (p.stats?.views || 0), 0);

  // Recent signups (last 10)
  const recentUsers = [...users]
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?._seconds || 0;
      const bTime = b.createdAt?.seconds || b.createdAt?._seconds || 0;
      return bTime - aTime;
    })
    .slice(0, 10);

  // Recent properties (last 10)
  const recentProperties = [...properties]
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?._seconds || 0;
      const bTime = b.createdAt?.seconds || b.createdAt?._seconds || 0;
      return bTime - aTime;
    })
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={users.length} icon={Users} color="blue" />
        <StatCard label="Total Properties" value={properties.length} icon={Home} color="purple" />
        <StatCard label="Active Campaigns" value={activeCampaigns} icon={TrendingUp} color="emerald" />
        <StatCard label="API Approved" value={apiApproved} icon={ShieldCheck} color="orange" />
        <StatCard label="API Pending" value={apiPending} icon={Clock} color="amber" />
        <StatCard label="Total Views" value={totalViews.toLocaleString()} icon={Eye} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-600">Recent Signups</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentUsers.map((u) => (
              <div key={u.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {(u.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'No name'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {u.pro && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700">PRO</span>
                  )}
                  {u.isAgent && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">AGENT</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Properties */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-600">Recent Properties</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentProperties.map((p) => (
              <div key={p.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {p.imageUrl || p.images?.[0] ? (
                    <img src={p.imageUrl || p.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {p.address || p.formattedAddress || 'No address'}
                  </p>
                  <p className="text-xs text-slate-500">{p.price || '--'}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${
                  p.visibility ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {p.visibility ? 'Public' : 'Private'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   USERS TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function UsersTab({ user }) {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch(`/api/admin/users?adminUid=${user.uid}`);
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error('Users fetch error:', err);
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, [user.uid]);

  const filteredUsers = useMemo(() => {
    let result = users;

    // Apply filter
    if (filter === 'agents') result = result.filter((u) => u.isAgent);
    else if (filter === 'buyers') result = result.filter((u) => u.isBuyer);
    else if (filter === 'pro') result = result.filter((u) => u.pro);
    else if (filter === 'superadmin') result = result.filter((u) => u.superAdmin);

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, search, filter]);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'agents', label: 'Agents' },
    { key: 'buyers', label: 'Buyers' },
    { key: 'pro', label: 'Pro' },
    { key: 'superadmin', label: 'Super Admin' },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm text-sm"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f.key
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Users list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600">
            Users ({filteredUsers.length})
          </h2>
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => router.push(`/dashboard/admin/users/${u.id}`)}
                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(u.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'No name'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                  {u.superAdmin && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700">ADMIN</span>
                  )}
                  {u.pro && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700">PRO</span>
                  )}
                  {u.isAgent && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">AGENT</span>
                  )}
                </div>
                <div className="hidden sm:block text-xs text-slate-400 w-20 text-right">
                  {u.propertyCount} props
                </div>
                <div className="hidden sm:block text-xs text-slate-500 w-28 text-right">
                  {formatDate(u.createdAt)}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPERTIES TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function PropertiesTab({ user }) {
  const [properties, setProperties] = useState([]);
  const [allUsers, setAllUsers] = useState({});
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const [propertiesSnap, usersRes] = await Promise.all([
          getDocs(collection(db, 'properties')),
          fetch(`/api/admin/users?adminUid=${user.uid}`),
        ]);
        const usersData = await usersRes.json();

        const userMap = {};
        for (const u of usersData.users || []) {
          userMap[u.id] = u;
        }

        setAllUsers(userMap);
        setProperties(
          propertiesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((p) => p.active !== false && p.archived !== true)
        );
      } catch (err) {
        console.error('Properties fetch error:', err);
      } finally {
        setPropertiesLoading(false);
      }
    }
    fetchData();
  }, [user.uid]);

  const filteredProperties = useMemo(() => {
    let result = properties;

    if (filter === 'public') result = result.filter((p) => p.visibility === true);
    else if (filter === 'private') result = result.filter((p) => !p.visibility);
    else if (filter === 'archived') result = result.filter((p) => p.archived === true);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const address = (p.address || p.formattedAddress || '').toLowerCase();
        const agentUid = p.userId || p.uid;
        const agent = allUsers[agentUid];
        const agentName = agent
          ? [agent.firstName, agent.lastName].filter(Boolean).join(' ').toLowerCase()
          : '';
        return address.includes(q) || agentName.includes(q);
      });
    }

    return result;
  }, [properties, search, filter, allUsers]);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'public', label: 'Public' },
    { key: 'private', label: 'Private' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by address or agent name..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm text-sm"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f.key
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600">
            Properties ({filteredProperties.length})
          </h2>
        </div>

        {propertiesLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No properties found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProperties.map((p) => {
              const agentUid = p.userId || p.uid;
              const agent = allUsers[agentUid];
              const agentName = agent
                ? [agent.firstName, agent.lastName].filter(Boolean).join(' ')
                : 'Unknown';

              return (
                <Link
                  key={p.id}
                  href={`/dashboard/property/${p.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group block"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.imageUrl || p.images?.[0] ? (
                      <img src={p.imageUrl || p.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {p.address || p.formattedAddress || 'No address'}
                    </p>
                    <p className="text-xs text-slate-500">{agentName} &middot; {p.price || '--'}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {p.stats?.views || 0}
                    </span>
                    <span>{p.stats?.opinions || 0} opinions</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${
                    p.visibility ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {p.visibility ? 'Public' : 'Private'}
                  </span>
                  <div className="hidden sm:block text-xs text-slate-500 w-28 text-right">
                    {formatDate(p.createdAt)}
                  </div>
                  <a
                    href={`/find-property?propertyId=${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open public listing"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-500 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   API REQUESTS TAB (existing logic)
   ═══════════════════════════════════════════════════════════════════════════ */

function ApiRequestsTab({ user }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchApiUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const allUsers = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.apiAccess && u.apiAccess.status !== 'none')
        .sort((a, b) => {
          const order = { pending: 0, approved: 1, revoked: 2 };
          return (order[a.apiAccess?.status] ?? 3) - (order[b.apiAccess?.status] ?? 3);
        });
      setUsers(allUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiUsers();
  }, [fetchApiUsers]);

  const handleAction = async (targetUid, action) => {
    setActionLoading(`${targetUid}-${action}`);
    try {
      const res = await fetch('/api/admin/api-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid: user.uid, targetUid, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Action failed');
        return;
      }

      await fetchApiUsers();
    } catch (err) {
      console.error('Action error:', err);
      alert('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const stats = {
    total: users.length,
    pending: users.filter((u) => u.apiAccess?.status === 'pending').length,
    approved: users.filter((u) => u.apiAccess?.status === 'approved').length,
    revoked: users.filter((u) => u.apiAccess?.status === 'revoked').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={stats.total} icon={Users} color="blue" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="amber" />
        <StatCard label="Approved" value={stats.approved} icon={ShieldCheck} color="emerald" />
        <StatCard label="Revoked" value={stats.revoked} icon={ShieldX} color="red" />
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600">
            API Access Requests ({filteredUsers.length})
          </h2>
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Key className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No API access requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <ApiUserRow
                key={u.id}
                user={u}
                onAction={handleAction}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApiUserRow({ user: u, onAction, actionLoading }) {
  const status = u.apiAccess?.status;
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'No name';

  const statusBadge = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
    revoked: { label: 'Revoked', className: 'bg-red-100 text-red-700' },
  };
  const badge = statusBadge[status] || { label: status, className: 'bg-slate-100 text-slate-600' };

  return (
    <div className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {(u.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{name}</p>
        <p className="text-xs text-slate-500 truncate">{u.email}</p>
      </div>
      <div className="hidden sm:block text-xs text-slate-500 w-28 text-right">
        {formatDate(u.apiAccess?.requestedAt)}
      </div>
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${badge.className}`}>
        {badge.label}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {(status === 'pending' || status === 'revoked') && (
          <button
            onClick={() => onAction(u.id, 'approve')}
            disabled={actionLoading === `${u.id}-approve`}
            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            title={status === 'revoked' ? 'Re-approve' : 'Approve'}
          >
            {actionLoading === `${u.id}-approve` ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        )}
        {status === 'approved' && (
          <button
            onClick={() => onAction(u.id, 'revoke')}
            disabled={actionLoading === `${u.id}-revoke`}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            title="Revoke"
          >
            {actionLoading === `${u.id}-revoke` ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
            ) : (
              <ShieldX className="w-4 h-4" />
            )}
          </button>
        )}
        <button
          onClick={() => {
            if (confirm(`Remove API access record for ${name}?`)) {
              onAction(u.id, 'delete');
            }
          }}
          disabled={actionLoading === `${u.id}-delete`}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
          title="Delete"
        >
          {actionLoading === `${u.id}-delete` ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCS ANALYTICS TAB (from docs-analytics/page.js)
   ═══════════════════════════════════════════════════════════════════════════ */

function DocsAnalyticsTab({ user, userData }) {
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [deactivating, setDeactivating] = useState(null);

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    setLinksLoading(true);
    try {
      const res = await fetch(`/api/docs/links?uid=${user.uid}`);
      const data = await res.json();
      setLinks(data.links || []);
    } catch (err) {
      console.error('Failed to fetch links:', err);
    } finally {
      setLinksLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const fetchSessions = async (linkToken) => {
    setSessionsLoading(true);
    setSessions([]);
    try {
      const { collection: col, query: q, where: w, getDocs: gd } = await import('firebase/firestore');
      const { db: clientDb } = await import('../../firebase/clientApp');

      const queryRef = q(col(clientDb, 'docSessions'), w('linkToken', '==', linkToken));
      const snapshot = await gd(queryRef);
      const sessionList = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
      setSessions(sessionList);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSelectLink = (link) => {
    setSelectedLink(link);
    setSelectedSession(null);
    fetchSessions(link.token);
  };

  const handleCopy = (token) => {
    navigator.clipboard.writeText(`https://premarket.homes/docs?t=${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeactivate = async (token) => {
    if (!confirm('Deactivate this link? Visitors will no longer be able to access docs with it.')) return;
    setDeactivating(token);
    try {
      await fetch(`/api/docs/links/${token}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });
      await fetchLinks();
      if (selectedLink?.token === token) {
        setSelectedLink(null);
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to deactivate:', err);
    } finally {
      setDeactivating(null);
    }
  };

  // Session detail view
  if (selectedSession) {
    return (
      <DocsSessionDetailView
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    );
  }

  // Sessions list for a link
  if (selectedLink) {
    return (
      <div>
        <button
          onClick={() => { setSelectedLink(null); setSessions([]); }}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to all links
        </button>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {selectedLink.label || 'Unlabelled Link'}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedLink.token}</p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                selectedLink.active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {selectedLink.active ? 'Active' : 'Deactivated'}
              </span>
            </div>
          </div>

          {sessionsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-orange-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16">
              <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No sessions recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((session) => {
                const device = parseUserAgent(session.userAgent);
                return (
                  <button
                    key={session.sessionId}
                    onClick={() => setSelectedSession(session)}
                    className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm text-slate-900">
                          {formatDateWithTime(session.startedAt)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDuration(session.duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{session.sectionsViewed?.length || 0} sections viewed</span>
                        <span>{session.interactions?.length || 0} interactions</span>
                        {device && (
                          <span className="text-slate-400">{device.browser} / {device.os}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {session.recordingUrl && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700">
                          Recording
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Links list (default)
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600">
          Trackable Links ({links.length})
        </h2>
        <Link
          href="/docs"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Docs
        </Link>
      </div>

      {linksLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16">
          <LinkIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No trackable links created yet</p>
          <p className="text-slate-400 text-xs mt-1">
            Generate links from the docs page floating toolbar
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {links.map((link) => (
            <div
              key={link.token}
              className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleSelectLink(link)}
              >
                <div className="flex items-center gap-3 mb-0.5">
                  <p className="font-semibold text-slate-900 text-sm">
                    {link.label || 'Unlabelled'}
                  </p>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    link.active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {link.active ? 'Active' : 'Deactivated'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">{link.token}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                  <span>{formatDateWithTime(link.createdAt)}</span>
                  <span>{link.sessionCount || 0} sessions</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleCopy(link.token)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Copy URL"
                >
                  {copiedToken === link.token ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {link.active && (
                  <button
                    onClick={() => handleDeactivate(link.token)}
                    disabled={deactivating === link.token}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Deactivate"
                  >
                    {deactivating === link.token ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocsSessionDetailView({ session, onClose }) {
  const playerContainerRef = useRef(null);
  const [loadingReplay, setLoadingReplay] = useState(!!session.recordingUrl);
  const [replayError, setReplayError] = useState(null);
  const device = parseUserAgent(session.userAgent);

  useEffect(() => {
    if (!session.recordingUrl || !playerContainerRef.current) return;

    let mounted = true;

    async function loadReplay() {
      try {
        const res = await fetch(`/api/docs/sessions/recording?id=${session.sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch recording');
        const events = await res.json();

        if (!mounted || !playerContainerRef.current || !events.length) return;

        playerContainerRef.current.innerHTML = '';

        const rrwebPlayer = await import('rrweb-player');
        const Player = rrwebPlayer.default || rrwebPlayer;

        new Player({
          target: playerContainerRef.current,
          props: {
            events,
            width: playerContainerRef.current.offsetWidth,
            height: 500,
            autoPlay: false,
          },
        });

        if (mounted) setLoadingReplay(false);
      } catch (err) {
        console.error('Replay error:', err);
        if (mounted) {
          setReplayError('Failed to load session replay');
          setLoadingReplay(false);
        }
      }
    }

    loadReplay();
    return () => { mounted = false; };
  }, [session.recordingUrl, session.sessionId]);

  return (
    <div>
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sessions
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Duration</p>
          <p className="text-xl font-bold text-slate-900">{formatDuration(session.duration)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Sections Viewed</p>
          <p className="text-xl font-bold text-slate-900">{session.sectionsViewed?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Interactions</p>
          <p className="text-xl font-bold text-slate-900">{session.interactions?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Device</p>
          <p className="text-xl font-bold text-slate-900">{device?.browser || '--'}</p>
          <p className="text-xs text-slate-400">{device?.os || ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {session.recordingUrl && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Play className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Session Replay</h3>
              </div>
              <div className="p-4">
                {loadingReplay && !replayError && (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-orange-500" />
                  </div>
                )}
                {replayError && (
                  <div className="text-center py-12">
                    <p className="text-red-500 text-sm">{replayError}</p>
                  </div>
                )}
                <div ref={playerContainerRef} />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Sections Viewed ({session.sectionsViewed?.length || 0})
              </h3>
            </div>
            {session.sectionsViewed?.length > 0 ? (
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {session.sectionsViewed.map((s, i) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg"
                    >
                      <span className="w-5 h-5 bg-slate-200 rounded-full text-xs flex items-center justify-center font-medium text-slate-600">
                        {i + 1}
                      </span>
                      {s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No sections tracked</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Interactions ({session.interactions?.length || 0})
              </h3>
            </div>
            {session.interactions?.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {session.interactions.map((interaction, i) => {
                  const relativeTime = session.startedAt
                    ? Math.round((interaction.timestamp - new Date(session.startedAt).getTime()) / 1000)
                    : null;
                  return (
                    <div key={i} className="px-6 py-3 flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {interaction.type === 'click' ? (
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <MousePointer className="w-3 h-3 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Type className="w-3 h-3 text-purple-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-medium ${
                            interaction.type === 'click' ? 'text-blue-700' : 'text-purple-700'
                          }`}>
                            {interaction.type === 'click' ? 'Click' : 'Selection'}
                          </span>
                          {relativeTime !== null && (
                            <span className="text-xs text-slate-400">
                              +{formatDuration(Math.max(0, relativeTime))}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 break-words">
                          {interaction.target || '--'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No interactions recorded</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Session Info</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Started</p>
                <p className="text-sm text-slate-900">{formatDateWithTime(session.startedAt)}</p>
              </div>
              {session.endedAt && (
                <div>
                  <p className="text-xs text-slate-500">Ended</p>
                  <p className="text-sm text-slate-900">{formatDateWithTime(session.endedAt)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">Session ID</p>
                <p className="text-xs text-slate-600 font-mono break-all">{session.sessionId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Link Token</p>
                <p className="text-xs text-slate-600 font-mono break-all">{session.linkToken}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Recording</p>
                <p className="text-sm text-slate-900">
                  {session.recordingUrl ? (
                    <span className="text-emerald-600 font-medium">Available</span>
                  ) : (
                    <span className="text-slate-400">Not captured</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {session.userAgent && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  Device
                </span>
              </h4>
              {device && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Browser</span>
                    <span className="text-slate-900 font-medium">{device.browser}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">OS</span>
                    <span className="text-slate-900 font-medium">{device.os}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400 break-all leading-relaxed">{session.userAgent}</p>
            </div>
          )}

          {session.referrer && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Referrer
                </span>
              </h4>
              <p className="text-sm text-slate-600 break-all">{session.referrer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEVELOPER DOCS TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function DeveloperDocsTab() {
  const [expandedSection, setExpandedSection] = useState('architecture');

  const sections = [
    { key: 'architecture', title: 'Architecture Overview' },
    { key: 'data-model', title: 'Data Model' },
    { key: 'buyer-score', title: 'Buyer Score Algorithm' },
    { key: 'seller-score', title: 'Seller Score Algorithm' },
    { key: 'market-forecast', title: 'Market Forecast' },
    { key: 'score-pipeline', title: 'Score Pre-computation Pipeline' },
    { key: 'api-endpoints', title: 'API Endpoints' },
    { key: 'tech-stack', title: 'Tech Stack' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Internal Developer Documentation</h2>
        <p className="text-sm text-slate-500">
          Platform architecture, algorithms, and technical reference. Admin-only.
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${
                expandedSection === section.key ? 'rotate-90' : ''
              }`}
            />
          </button>
          {expandedSection === section.key && (
            <div className="px-6 pb-6 border-t border-slate-100 pt-4">
              <DocSection sectionKey={section.key} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DocSection({ sectionKey }) {
  const prose = 'text-sm text-slate-700 leading-relaxed space-y-3';
  const heading = 'text-sm font-semibold text-slate-900 mt-4 mb-2';
  const code = 'bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono';
  const table = 'w-full text-sm border-collapse';
  const th = 'text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-3 border-b border-slate-200';
  const td = 'py-2 px-3 border-b border-slate-100 text-slate-700';

  switch (sectionKey) {
    case 'architecture':
      return (
        <div className={prose}>
          <p>Premarket is a three-tier platform for off-market real estate.</p>
          <p className={heading}>Components</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Next.js Website</strong> — Next.js 15 (App Router) deployed on Vercel at <span className={code}>premarket.homes</span>. Handles the marketing site, agent dashboard, API endpoints, cron jobs, and admin tools.</li>
            <li><strong>Flutter Mobile App</strong> — iOS and Android app for buyers and agents. Connects directly to Firebase/Firestore for real-time data.</li>
            <li><strong>Firebase Functions</strong> — Handles background triggers (new property, new offer, signup), Cloud Tasks (image/video generation), Puppeteer scrapers, and scheduled newsletters.</li>
            <li><strong>Firestore</strong> — Primary database. Collections include users, properties, offers, likes, marketScores, marketTrends, docSessions, and more.</li>
          </ul>
          <p className={heading}>Deployment</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Website deploys automatically via Vercel on push to <span className={code}>main</span></li>
            <li>Firebase Functions deploy via <span className={code}>firebase deploy --only functions</span></li>
            <li>Cron jobs configured in <span className={code}>vercel.json</span> and execute as Vercel Cron Functions</li>
          </ul>

          <p className={heading}>Related Repositories</p>
          <table className={table}>
            <thead><tr><th className={th}>Repo</th><th className={th}>Path</th><th className={th}>Purpose</th></tr></thead>
            <tbody>
              <tr><td className={td}>premarket-website</td><td className={td}><span className={code}>./</span></td><td className={td}>This repo. Next.js website, API, admin, crons.</td></tr>
              <tr><td className={td}>premarket2</td><td className={td}><span className={code}>../premarket2/</span></td><td className={td}>Flutter mobile app (iOS + Android)</td></tr>
              <tr><td className={td}>premarketHomesFunctions</td><td className={td}><span className={code}>../premarketHomesFunctions/functions/</span></td><td className={td}>Firebase Functions (triggers, Cloud Tasks, Puppeteer)</td></tr>
            </tbody>
          </table>

          <p className={heading}>Navigating the Codebase</p>
          <p>Everything lives under <span className={code}>src/app/</span>. Next.js App Router uses folders as routes &mdash; a <span className={code}>page.js</span> in a folder becomes a page, a <span className={code}>route.js</span> becomes an API endpoint.</p>

          <p className={heading}>Top-Level Directory Map</p>
          <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto">
            <p>src/app/</p>
            <p className="pl-4">api/                    &larr; All API routes (REST endpoints)</p>
            <p className="pl-4">components/             &larr; Shared React components (landing pages, SEO schema, UI)</p>
            <p className="pl-4">context/                &larr; React Context providers (AuthContext, ModalContext)</p>
            <p className="pl-4">dashboard/              &larr; Authenticated agent dashboard pages</p>
            <p className="pl-4">firebase/               &larr; Firebase init (adminApp.js for server, clientApp.js for browser)</p>
            <p className="pl-4">docs/                   &larr; Public docs page</p>
            <p className="pl-4">find-property/          &larr; Property search page</p>
            <p className="pl-4">join/                   &larr; Signup flow (form, success, terms)</p>
            <p className="pl-4">listings/               &larr; Public property listings</p>
            <p className="pl-4">login/                  &larr; Login page</p>
            <p className="pl-4">privacy/ | terms/       &larr; Legal pages</p>
            <p className="pl-4">unsubscribe/            &larr; Email unsubscribe</p>
            <p className="pl-4">layout.js               &larr; Root layout (providers, fonts, metadata)</p>
            <p className="pl-4">page.js                 &larr; Homepage</p>
            <p className="pl-4">globals.css             &larr; Global styles</p>
          </div>

          <p className={heading}>API Routes by Domain</p>
          <table className={table}>
            <thead><tr><th className={th}>Domain</th><th className={th}>Path</th><th className={th}>What&apos;s Here</th></tr></thead>
            <tbody>
              <tr><td className={td}>Admin</td><td className={td}><span className={code}>api/admin/</span></td><td className={td}>User management, API access, compute-scores trigger, user notes, password reset</td></tr>
              <tr><td className={td}>Public API (v1)</td><td className={td}><span className={code}>api/v1/</span></td><td className={td}>8 endpoints (buyer-score, seller-score, market-forecast, trending-areas, etc.) + middleware.js, helpers.js, scoreComputation.js</td></tr>
              <tr><td className={td}>Cron Jobs</td><td className={td}><span className={code}>api/cron/</span></td><td className={td}>compute-scores (daily), compute-trends (monthly), cleanup-stale (6h), sync-agentbox (2h)</td></tr>
              <tr><td className={td}>Integrations</td><td className={td}><span className={code}>api/integrations/agentbox/</span></td><td className={td}>AgentBox CRM: connect, disconnect, import, sync, sync-contacts, toggle</td></tr>
              <tr><td className={td}>CoreLogic</td><td className={td}><span className={code}>api/core-logic/</span></td><td className={td}>Property data enrichment: search properties, get property by ID</td></tr>
              <tr><td className={td}>Docs Analytics</td><td className={td}><span className={code}>api/docs/</span></td><td className={td}>Trackable links, session tracking, rrweb recordings</td></tr>
              <tr><td className={td}>Email</td><td className={td}><span className={code}>api/send-link</span>, <span className={code}>send-invite-link</span>, <span className={code}>send-report</span>, <span className={code}>emails</span></td><td className={td}>Transactional emails via Resend</td></tr>
              <tr><td className={td}>Newsletter</td><td className={td}><span className={code}>api/newsletter/</span></td><td className={td}>Preview and send newsletters</td></tr>
              <tr><td className={td}>Webhooks</td><td className={td}><span className={code}>api/webhooks/xero</span></td><td className={td}>Xero/Stripe invoice webhook (HMAC validated)</td></tr>
              <tr><td className={td}>AI</td><td className={td}><span className={code}>api/chat</span>, <span className={code}>api/generate-listing</span></td><td className={td}>AI chat and property description generation</td></tr>
              <tr><td className={td}>Uploads</td><td className={td}><span className={code}>api/upload-image</span></td><td className={td}>Image uploads to Bunny CDN</td></tr>
            </tbody>
          </table>

          <p className={heading}>Service Layer</p>
          <p>External API clients live in <span className={code}>api/services/</span>. Each uses lazy initialization to avoid build-time failures.</p>
          <table className={table}>
            <thead><tr><th className={th}>Service</th><th className={th}>File</th><th className={th}>External API</th></tr></thead>
            <tbody>
              <tr><td className={td}>AgentBox</td><td className={td}><span className={code}>agentboxService.js</span></td><td className={td}>AgentBox CRM API</td></tr>
              <tr><td className={td}>CoreLogic</td><td className={td}><span className={code}>coreLogicService.js</span></td><td className={td}>CoreLogic property data</td></tr>
              <tr><td className={td}>Email</td><td className={td}><span className={code}>resendService.js</span></td><td className={td}>Resend email API</td></tr>
              <tr><td className={td}>AI</td><td className={td}><span className={code}>openAiService.js</span></td><td className={td}>OpenAI GPT</td></tr>
              <tr><td className={td}>Newsletter</td><td className={td}><span className={code}>newsletterService.js</span></td><td className={td}>Newsletter composition</td></tr>
              <tr><td className={td}>Reports</td><td className={td}><span className={code}>reportService.js</span></td><td className={td}>Property report generation</td></tr>
              <tr><td className={td}>Accounting</td><td className={td}><span className={code}>xeroService.js</span></td><td className={td}>Xero accounting API</td></tr>
            </tbody>
          </table>

          <p className={heading}>Dashboard Pages</p>
          <table className={table}>
            <thead><tr><th className={th}>Route</th><th className={th}>File</th><th className={th}>Purpose</th></tr></thead>
            <tbody>
              <tr><td className={td}>/dashboard</td><td className={td}><span className={code}>dashboard/page.js</span></td><td className={td}>Agent home &mdash; property list</td></tr>
              <tr><td className={td}>/dashboard/add</td><td className={td}><span className={code}>dashboard/add/page.js</span></td><td className={td}>Add new property</td></tr>
              <tr><td className={td}>/dashboard/edit/[id]</td><td className={td}><span className={code}>dashboard/edit/[id]/page.js</span></td><td className={td}>Edit property</td></tr>
              <tr><td className={td}>/dashboard/property/[id]</td><td className={td}><span className={code}>dashboard/property/[id]/page.js</span></td><td className={td}>Property report / detail view</td></tr>
              <tr><td className={td}>/dashboard/integrations</td><td className={td}><span className={code}>dashboard/integrations/page.js</span></td><td className={td}>AgentBox CRM integration setup</td></tr>
              <tr><td className={td}>/dashboard/developers</td><td className={td}><span className={code}>dashboard/developers/page.js</span></td><td className={td}>Agent-facing API docs &amp; key management</td></tr>
              <tr><td className={td}>/dashboard/playground</td><td className={td}><span className={code}>dashboard/playground/page.js</span></td><td className={td}>API testing sandbox</td></tr>
              <tr><td className={td}>/dashboard/admin</td><td className={td}><span className={code}>dashboard/admin/page.js</span></td><td className={td}>This admin dashboard</td></tr>
              <tr><td className={td}>/dashboard/admin/users/[id]</td><td className={td}><span className={code}>dashboard/admin/users/[id]/page.js</span></td><td className={td}>Individual customer management</td></tr>
            </tbody>
          </table>

          <p className={heading}>Key Shared Files</p>
          <table className={table}>
            <thead><tr><th className={th}>File</th><th className={th}>Purpose</th></tr></thead>
            <tbody>
              <tr><td className={td}><span className={code}>context/AuthContext.js</span></td><td className={td}>Firebase auth state, useAuth() hook, userData from Firestore</td></tr>
              <tr><td className={td}><span className={code}>context/ModalContext.js</span></td><td className={td}>Global modal state management</td></tr>
              <tr><td className={td}><span className={code}>firebase/adminApp.js</span></td><td className={td}>Firebase Admin SDK singleton (server-side only)</td></tr>
              <tr><td className={td}><span className={code}>firebase/clientApp.js</span></td><td className={td}>Firebase Client SDK init (browser)</td></tr>
              <tr><td className={td}><span className={code}>api/v1/middleware.js</span></td><td className={td}>validateApiKey() &mdash; checks x-api-key header against Firestore</td></tr>
              <tr><td className={td}><span className={code}>api/v1/helpers.js</span></td><td className={td}>Geocoding, distance calc, Firestore queries, score algorithms</td></tr>
              <tr><td className={td}><span className={code}>api/v1/scoreComputation.js</span></td><td className={td}>Score pre-computation, caching, trend snapshots</td></tr>
            </tbody>
          </table>

          <p className={heading}>Config Files (Root)</p>
          <table className={table}>
            <thead><tr><th className={th}>File</th><th className={th}>Purpose</th></tr></thead>
            <tbody>
              <tr><td className={td}><span className={code}>vercel.json</span></td><td className={td}>Cron schedules, redirects, headers</td></tr>
              <tr><td className={td}><span className={code}>next.config.mjs</span></td><td className={td}>Next.js config (image domains, etc.)</td></tr>
              <tr><td className={td}><span className={code}>postcss.config.mjs</span></td><td className={td}>PostCSS / Tailwind pipeline</td></tr>
              <tr><td className={td}><span className={code}>jsconfig.json</span></td><td className={td}>Path aliases (@ prefix)</td></tr>
              <tr><td className={td}><span className={code}>.env.local</span></td><td className={td}>Environment variables (gitignored)</td></tr>
            </tbody>
          </table>

          <p className={heading}>Components (src/app/components/)</p>
          <p>Landing page components are prefixed by audience: <span className={code}>Agent*</span> (agent landing), <span className={code}>Hero*</span> / <span className={code}>Features*</span> (general), <span className={code}>*Edge</span> (alternative A/B variants), <span className={code}>Schema*</span> (SEO structured data). Dashboard components are co-located in their page files.</p>

          <p className={heading}>Authentication Pattern</p>
          <p>Client pages use <span className={code}>useAuth()</span> from AuthContext. Admin pages additionally check <span className={code}>userData.superAdmin === true</span>. API routes verify admin by reading the user doc from Firestore via <span className={code}>adminDb</span> and checking the <span className={code}>superAdmin</span> field.</p>

          <p className={heading}>Quick Navigation Guide</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Finding an API endpoint:</strong> Go to <span className={code}>src/app/api/</span>, browse by domain folder. Each <span className={code}>route.js</span> exports HTTP methods (GET, POST, etc.).</li>
            <li><strong>Finding a page:</strong> Public pages are at <span className={code}>src/app/[page]/page.js</span>. Dashboard pages at <span className={code}>src/app/dashboard/[page]/page.js</span>.</li>
            <li><strong>Finding business logic:</strong> Check <span className={code}>api/services/</span> for external API clients, <span className={code}>api/v1/helpers.js</span> for score algorithms and geo queries.</li>
            <li><strong>Finding Firebase init:</strong> Server routes use <span className={code}>adminApp.js</span> (import <span className={code}>adminDb</span>). Client components use <span className={code}>clientApp.js</span> (import <span className={code}>db</span>).</li>
            <li><strong>Adding a new API route:</strong> Create <span className={code}>src/app/api/your-route/route.js</span> and export named functions (GET, POST, etc.).</li>
            <li><strong>Adding a new dashboard page:</strong> Create <span className={code}>src/app/dashboard/your-page/page.js</span>. Add <span className={code}>&apos;use client&apos;</span> at top, use <span className={code}>useAuth()</span> for auth guard.</li>
            <li><strong>Adding a cron job:</strong> Create route in <span className={code}>api/cron/</span>, add schedule to <span className={code}>vercel.json</span>. Validate <span className={code}>CRON_SECRET</span> header.</li>
          </ul>
        </div>
      );

    case 'data-model':
      return (
        <div className={prose}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Collection</th>
                <th className={th}>Key Fields</th>
                <th className={th}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}><span className={code}>users</span></td><td className={td}>firstName, lastName, email, isAgent, isBuyer, pro, superAdmin, apiAccess</td><td className={td}>All platform users (agents + buyers)</td></tr>
              <tr><td className={td}><span className={code}>properties</span></td><td className={td}>address, price, userId, visibility, location, gotoMarketGoal, isEager, stats</td><td className={td}>Property listings (on/off-market)</td></tr>
              <tr><td className={td}><span className={code}>offers</span></td><td className={td}>propertyId, type, serious, seriousnessLevel, offerAmount, isFirstHomeBuyer</td><td className={td}>Buyer opinions and serious offers</td></tr>
              <tr><td className={td}><span className={code}>likes</span></td><td className={td}>propertyId, userId</td><td className={td}>Property likes/saves</td></tr>
              <tr><td className={td}><span className={code}>marketScores</span></td><td className={td}>suburb, state, buyerScore, sellerScore, computedAt, stale</td><td className={td}>Pre-computed suburb scores (daily)</td></tr>
              <tr><td className={td}><span className={code}>marketTrends</span></td><td className={td}>suburb, state, monthKey, buyerScore, sellerScore</td><td className={td}>Monthly score snapshots for trends</td></tr>
            </tbody>
          </table>
        </div>
      );

    case 'buyer-score':
      return (
        <div className={prose}>
          <p>The Buyer Score (0-100) measures buyer demand intensity for a suburb. Computed from all properties within a 10km radius of the suburb center.</p>
          <p className={heading}>Signals & Weights</p>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Signal</th>
                <th className={th}>Weight</th>
                <th className={th}>Normalization Max</th>
                <th className={th}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}>Opinions count</td><td className={td}>20%</td><td className={td}>50</td><td className={td}>Total opinions (type == &apos;opinion&apos;) across all properties</td></tr>
              <tr><td className={td}>Serious buyers</td><td className={td}>35%</td><td className={td}>20</td><td className={td}>Opinions where serious == true</td></tr>
              <tr><td className={td}>Likes</td><td className={td}>15%</td><td className={td}>100</td><td className={td}>Total likes across all properties</td></tr>
              <tr><td className={td}>Seriousness level</td><td className={td}>20%</td><td className={td}>200</td><td className={td}>Weighted sum: low=1, medium=2, high=3, very high=4</td></tr>
              <tr><td className={td}>Buyer diversity</td><td className={td}>10%</td><td className={td}>1.0</td><td className={td}>FHB vs investor mix ratio (1 = perfect balance)</td></tr>
            </tbody>
          </table>
          <p className={heading}>Formula</p>
          <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <p>score = round(</p>
            <p className="pl-4">(min(opinions/50, 1) * 0.20) +</p>
            <p className="pl-4">(min(serious/20, 1) * 0.35) +</p>
            <p className="pl-4">(min(likes/100, 1) * 0.15) +</p>
            <p className="pl-4">(min(seriousnessScore/200, 1) * 0.20) +</p>
            <p className="pl-4">(diversityRatio * 0.10)</p>
            <p>) * 100</p>
          </div>
          <p className={heading}>Breakdown Fields</p>
          <p>The API returns: totalOpinions, seriousBuyers, passiveBuyers, totalLikes, seriousnessScore, diversityRatio, fhbCount, investorCount.</p>
        </div>
      );

    case 'seller-score':
      return (
        <div className={prose}>
          <p>The Seller Score (0-100) measures seller supply activity for a suburb. Higher scores indicate more properties coming to market soon.</p>
          <p className={heading}>Signals & Weights</p>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Signal</th>
                <th className={th}>Weight</th>
                <th className={th}>Normalization Max</th>
                <th className={th}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}>Active properties</td><td className={td}>25%</td><td className={td}>30</td><td className={td}>Properties with visibility == true</td></tr>
              <tr><td className={td}>Going to market (30d)</td><td className={td}>30%</td><td className={td}>15</td><td className={td}>gotoMarketGoal within next 30 days</td></tr>
              <tr><td className={td}>Going to market (60d)</td><td className={td}>10%</td><td className={td}>15</td><td className={td}>gotoMarketGoal within next 60 days</td></tr>
              <tr><td className={td}>Eager sellers</td><td className={td}>20%</td><td className={td}>10</td><td className={td}>Properties where isEager &gt;= 70</td></tr>
              <tr><td className={td}>Listing density</td><td className={td}>15%</td><td className={td}>50</td><td className={td}>Total property count in radius</td></tr>
            </tbody>
          </table>
          <p className={heading}>Breakdown Fields</p>
          <p>The API returns: activeProperties, totalProperties, goingToMarket30, goingToMarket60, goingToMarket90, eagerSellers.</p>
        </div>
      );

    case 'market-forecast':
      return (
        <div className={prose}>
          <p>The upcoming-to-market forecast identifies properties likely to hit the market within 30 days.</p>
          <p className={heading}>How it works</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Finds all properties within the search radius where <span className={code}>gotoMarketGoal</span> falls within the next 30 days</li>
            <li>Calculates <strong>median listing price</strong> from those properties</li>
            <li>Computes a <strong>demand ratio</strong>: median offer amount / median listing price across all opinions in the area</li>
            <li>A demand ratio &gt; 1.0 indicates offers exceeding asking prices (high demand)</li>
          </ul>
          <p className={heading}>Response</p>
          <p>Returns <span className={code}>forecastNext30</span> with: count, medianPrice, demandRatio.</p>
        </div>
      );

    case 'score-pipeline':
      return (
        <div className={prose}>
          <p>Scores are pre-computed and cached to avoid expensive real-time calculations on every API request.</p>
          <p className={heading}>Collections</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><span className={code}>marketScores</span> — One doc per suburb, keyed as <span className={code}>{'{suburb_slug}_{state}'}</span>. Updated daily.</li>
            <li><span className={code}>marketTrends</span> — Monthly snapshots, keyed as <span className={code}>{'{suburb_slug}_{state}_{YYYY-MM}'}</span>.</li>
          </ul>
          <p className={heading}>Cron Jobs</p>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Job</th>
                <th className={th}>Schedule</th>
                <th className={th}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}>compute-scores</td><td className={td}>Daily (2am AEST)</td><td className={td}>Recomputes all suburb scores from properties/offers/likes</td></tr>
              <tr><td className={td}>compute-trends</td><td className={td}>Monthly (1st of month)</td><td className={td}>Snapshots current scores into marketTrends</td></tr>
              <tr><td className={td}>cleanup-stale</td><td className={td}>Every 6 hours</td><td className={td}>Recomputes scores marked as stale by invalidation triggers</td></tr>
            </tbody>
          </table>
          <p className={heading}>Invalidation</p>
          <p>Firebase triggers on property/offer/like changes mark the relevant suburb&apos;s score as <span className={code}>stale: true</span>. The cleanup-stale cron then recomputes only stale entries.</p>
          <p className={heading}>Fallback</p>
          <p>API endpoints try the cache first. If no cached score exists, they fall back to real-time computation.</p>
        </div>
      );

    case 'api-endpoints':
      return (
        <div className={prose}>
          <p className={heading}>Public API (v1)</p>
          <p>All endpoints require an API key via <span className={code}>x-api-key</span> header or <span className={code}>apiKey</span> query param.</p>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Endpoint</th>
                <th className={th}>Method</th>
                <th className={th}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}><span className={code}>/api/v1/buyer-score</span></td><td className={td}>GET</td><td className={td}>Buyer demand score for a location (0-100)</td></tr>
              <tr><td className={td}><span className={code}>/api/v1/seller-score</span></td><td className={td}>GET</td><td className={td}>Seller supply score for a location (0-100)</td></tr>
              <tr><td className={td}><span className={code}>/api/v1/market-forecast</span></td><td className={td}>GET</td><td className={td}>Upcoming-to-market properties and demand ratio</td></tr>
              <tr><td className={td}><span className={code}>/api/v1/trending-areas</span></td><td className={td}>GET</td><td className={td}>Top suburbs by buyer or seller score</td></tr>
              <tr><td className={td}><span className={code}>/api/v1/historical-trends</span></td><td className={td}>GET</td><td className={td}>Monthly score history for a suburb</td></tr>
              <tr><td className={td}><span className={code}>/api/v1/property-insights</span></td><td className={td}>GET</td><td className={td}>Aggregated property data for a location</td></tr>
              <tr><td className={td}><span className={code}>/api/v1/national-overview</span></td><td className={td}>GET</td><td className={td}>National market summary across all suburbs</td></tr>
              <tr><td className={td}><span className={code}>/api/v1/upcoming-to-market</span></td><td className={td}>GET</td><td className={td}>Properties expected to list soon</td></tr>
            </tbody>
          </table>
          <p className={heading}>Location Parameters</p>
          <p>Most endpoints accept: <span className={code}>lat/lng</span>, <span className={code}>suburb+state</span>, <span className={code}>postcode</span>, or freeform <span className={code}>location</span> string. Geocoding is handled automatically via Mapbox.</p>
        </div>
      );

    case 'tech-stack':
      return (
        <div className={prose}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Layer</th>
                <th className={th}>Technology</th>
                <th className={th}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}>Framework</td><td className={td}>Next.js 15 (App Router)</td><td className={td}>Server/client rendering, API routes, cron handlers</td></tr>
              <tr><td className={td}>UI</td><td className={td}>React 19 + Tailwind CSS 4</td><td className={td}>Component library and utility-first styling</td></tr>
              <tr><td className={td}>Database</td><td className={td}>Firebase / Firestore</td><td className={td}>NoSQL document database with real-time sync</td></tr>
              <tr><td className={td}>Auth</td><td className={td}>Firebase Authentication</td><td className={td}>Email/password and social login</td></tr>
              <tr><td className={td}>Maps</td><td className={td}>Mapbox GL JS</td><td className={td}>Interactive maps and geocoding</td></tr>
              <tr><td className={td}>AI</td><td className={td}>Anthropic Claude</td><td className={td}>Property description generation</td></tr>
              <tr><td className={td}>Email</td><td className={td}>Resend</td><td className={td}>Transactional emails and newsletters</td></tr>
              <tr><td className={td}>Payments</td><td className={td}>Stripe</td><td className={td}>Subscription billing for Pro agents</td></tr>
              <tr><td className={td}>Property Data</td><td className={td}>CoreLogic</td><td className={td}>Property data enrichment and valuation</td></tr>
              <tr><td className={td}>Hosting</td><td className={td}>Vercel</td><td className={td}>Edge deployment, serverless functions, cron</td></tr>
              <tr><td className={td}>Mobile</td><td className={td}>Flutter / Dart</td><td className={td}>Cross-platform iOS and Android app</td></tr>
              <tr><td className={td}>Media</td><td className={td}>Google Veo 3 / SeedReam</td><td className={td}>AI video and image generation via Cloud Tasks</td></tr>
              <tr><td className={td}>Analytics</td><td className={td}>rrweb</td><td className={td}>Session replay recording for docs analytics</td></tr>
            </tbody>
          </table>
        </div>
      );

    default:
      return <p className="text-sm text-slate-500">Section not found.</p>;
  }
}
