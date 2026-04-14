'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, ChevronRight, Trash2, Loader2, MessageCircle, X } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../ToastProvider';
import useConfirm from '../../hooks/useConfirm';
import { authFetch } from '../../../../utils/authFetch';
import { formatDisplayPhone, normalizeE164 } from '../../../../utils/phone';

export default function UsersTab({ user }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [smsEditUser, setSmsEditUser] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await authFetch(`/api/admin/users`);
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
    let result = [...users];

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

    // Sort newest first
    result.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

    return result;
  }, [users, search, filter]);

  const handleDelete = async (e, u) => {
    e.stopPropagation();
    if (u.superAdmin) {
      toast.error('Cannot delete superAdmin users');
      return;
    }
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
    const ok = await confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${name}? This will permanently remove all their data including properties, offers, and likes.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (!ok) return;

    setDeletingId(u.id);
    try {
      const res = await authFetch(`/api/admin/users/${u.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        toast.success(`Deleted ${name} (${data.deleted.properties} properties, ${data.deleted.offers} offers)`);
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveSms = async (targetUid, nextPhone, nextEnabled) => {
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUid,
          updates: {
            smsPhone: nextPhone || null,
            smsEnabled: nextEnabled && !!nextPhone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save SMS settings');
        return false;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUid
            ? { ...u, smsPhone: nextPhone || null, smsEnabled: !!nextEnabled && !!nextPhone }
            : u
        )
      );
      toast.success('SMS settings updated');
      return true;
    } catch (err) {
      console.error('SMS update error:', err);
      toast.error('Failed to save SMS settings');
      return false;
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'agents', label: 'Agents' },
    { key: 'buyers', label: 'Buyers' },
    { key: 'pro', label: 'Pro' },
    { key: 'superadmin', label: 'Super Admin' },
  ];

  return (
    <div className="space-y-4">
      {ConfirmDialog}

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
              <div
                key={u.id}
                onClick={() => router.push(`/dashboard/admin/users/${u.id}`)}
                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer"
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
                <button
                  onClick={(e) => { e.stopPropagation(); setSmsEditUser(u); }}
                  className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors w-32 justify-start ${
                    u.smsEnabled
                      ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                      : u.smsPhone
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      : 'bg-white border border-dashed border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                  title={u.smsPhone ? 'Edit SMS settings' : 'Add SMS phone'}
                >
                  <MessageCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {u.smsPhone ? formatDisplayPhone(u.smsPhone) : 'Add SMS'}
                  </span>
                </button>
                <div className="hidden sm:block text-xs text-slate-500 w-28 text-right">
                  {formatDate(u.createdAt)}
                </div>
                {!u.superAdmin && (
                  <button
                    onClick={(e) => handleDelete(e, u)}
                    disabled={deletingId === u.id}
                    className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 disabled:opacity-50"
                    title="Delete user"
                  >
                    {deletingId === u.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {smsEditUser && (
        <SmsEditModal
          user={smsEditUser}
          onClose={() => setSmsEditUser(null)}
          onSave={handleSaveSms}
        />
      )}
    </div>
  );
}

function SmsEditModal({ user, onClose, onSave }) {
  const [phone, setPhone] = useState(user.smsPhone || '');
  const [enabled, setEnabled] = useState(!!user.smsEnabled);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError('');
    let normalized = null;
    const trimmed = phone.trim();
    if (trimmed) {
      normalized = normalizeE164(trimmed);
      if (!normalized) {
        setError('Enter a valid mobile, e.g. 0412 345 678');
        return;
      }
    }
    setSaving(true);
    const ok = await onSave(user.id, normalized, enabled);
    setSaving(false);
    if (ok) onClose();
  };

  const handleClear = async () => {
    setSaving(true);
    const ok = await onSave(user.id, null, false);
    setSaving(false);
    if (ok) onClose();
  };

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">SMS Shortcuts</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <p className="text-sm text-slate-500 mb-4">
            Editing SMS settings for <span className="font-semibold text-slate-700">{displayName}</span>.
          </p>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Mobile number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (error) setError(''); }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all ${error ? 'border-red-300' : 'border-slate-200'}`}
              placeholder="0412 345 678"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>

          <label
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
              enabled ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
            } ${!phone.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <MessageCircle className={`w-4 h-4 ${enabled ? 'text-orange-600' : 'text-slate-400'}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">Enable SMS shortcuts</div>
              <div className="text-xs text-slate-500">
                Let this user text the Premarket number to add listings + pull reports.
              </div>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!phone.trim()}
              className="w-4 h-4 accent-orange-600"
            />
          </label>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          {user.smsPhone && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#e48900] to-[#c64500] rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
