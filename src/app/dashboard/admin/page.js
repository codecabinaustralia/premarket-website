'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/clientApp';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
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
} from 'lucide-react';

function formatDate(ts) {
  if (!ts) return '--';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminApiPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/join');
      return;
    }
    if (!loading && userData && userData.superAdmin !== true) {
      router.push('/dashboard');
    }
  }, [user, userData, loading, router]);

  // Fetch all users with apiAccess
  useEffect(() => {
    if (!user || userData?.superAdmin !== true) return;

    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const allUsers = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.apiAccess && u.apiAccess.status !== 'none')
          .sort((a, b) => {
            // Pending first, then approved, then revoked
            const order = { pending: 0, approved: 1, revoked: 2 };
            const aOrder = order[a.apiAccess?.status] ?? 3;
            const bOrder = order[b.apiAccess?.status] ?? 3;
            return aOrder - bOrder;
          });
        setUsers(allUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [user, userData]);

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

      // Refresh users list
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">API Access Admin</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Requests" value={stats.total} icon={Users} color="blue" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="amber" />
          <StatCard label="Approved" value={stats.approved} icon={ShieldCheck} color="emerald" />
          <StatCard label="Revoked" value={stats.revoked} icon={ShieldX} color="red" />
        </div>

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

        {/* Users Table */}
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
                <UserRow
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
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-5 ${colors[color]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 opacity-60" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-70 mt-1">{label}</div>
    </motion.div>
  );
}

function UserRow({ user, onAction, actionLoading }) {
  const status = user.apiAccess?.status;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';

  const statusBadge = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
    revoked: { label: 'Revoked', className: 'bg-red-100 text-red-700' },
  };

  const badge = statusBadge[status] || { label: status, className: 'bg-slate-100 text-slate-600' };

  return (
    <div className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {(user.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{name}</p>
        <p className="text-xs text-slate-500 truncate">{user.email}</p>
      </div>

      {/* Date */}
      <div className="hidden sm:block text-xs text-slate-500 w-28 text-right">
        {formatDate(user.apiAccess?.requestedAt)}
      </div>

      {/* Status */}
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${badge.className}`}>
        {badge.label}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {status === 'pending' && (
          <button
            onClick={() => onAction(user.id, 'approve')}
            disabled={actionLoading === `${user.id}-approve`}
            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            title="Approve"
          >
            {actionLoading === `${user.id}-approve` ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        )}
        {status === 'approved' && (
          <button
            onClick={() => onAction(user.id, 'revoke')}
            disabled={actionLoading === `${user.id}-revoke`}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            title="Revoke"
          >
            {actionLoading === `${user.id}-revoke` ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
            ) : (
              <ShieldX className="w-4 h-4" />
            )}
          </button>
        )}
        {status === 'revoked' && (
          <button
            onClick={() => onAction(user.id, 'approve')}
            disabled={actionLoading === `${user.id}-approve`}
            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            title="Re-approve"
          >
            {actionLoading === `${user.id}-approve` ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        )}
        <button
          onClick={() => {
            if (confirm(`Remove API access record for ${name}?`)) {
              onAction(user.id, 'delete');
            }
          }}
          disabled={actionLoading === `${user.id}-delete`}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
          title="Delete"
        >
          {actionLoading === `${user.id}-delete` ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
