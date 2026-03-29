'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase/clientApp';
import {
  Users,
  Clock,
  ShieldCheck,
  ShieldX,
  Search,
  Key,
  Check,
  Trash2,
  Loader2,
} from 'lucide-react';
import StatCard from '../StatCard';
import { useToast } from '../ToastProvider';
import useConfirm from '../../hooks/useConfirm';
import { formatDate } from '../../utils/formatters';
import { authFetch } from '../../../../utils/authFetch';

export default function ApiRequestsTab({ user }) {
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
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

  const handleAction = async (targetUid, action, name) => {
    if (action === 'delete') {
      const ok = await confirm({
        title: 'Remove API Access',
        message: `Remove API access record for ${name}?`,
        confirmLabel: 'Remove',
        confirmVariant: 'danger',
      });
      if (!ok) return;
    }

    setActionLoading(`${targetUid}-${action}`);
    try {
      const res = await authFetch('/api/admin/api-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Action failed');
        return;
      }

      toast.success(`API access ${action}d successfully`);
      await fetchApiUsers();
    } catch (err) {
      console.error('Action error:', err);
      toast.error('Action failed');
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
      {ConfirmDialog}

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
            {filteredUsers.map((u) => {
              const status = u.apiAccess?.status;
              const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'No name';
              const statusBadge = {
                pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
                approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
                revoked: { label: 'Revoked', className: 'bg-red-100 text-red-700' },
              };
              const badge = statusBadge[status] || { label: status, className: 'bg-slate-100 text-slate-600' };

              return (
                <div key={u.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
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
                        onClick={() => handleAction(u.id, 'approve', name)}
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
                        onClick={() => handleAction(u.id, 'revoke', name)}
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
                      onClick={() => handleAction(u.id, 'delete', name)}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
