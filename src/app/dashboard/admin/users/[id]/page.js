'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../firebase/clientApp';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldX,
  Check,
  X,
  Trash2,
  Key,
  Lock,
  Star,
  Crown,
  Home,
  Eye,
  MessageSquare,
  Building2,
  ChevronRight,
  Send,
  Loader2,
} from 'lucide-react';

function formatDate(ts) {
  if (!ts) return '--';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateWithTime(ts) {
  if (!ts) return '--';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminUserPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [targetUser, setTargetUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [notes, setNotes] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/join');
      return;
    }
    if (!loading && userData && userData.superAdmin !== true) {
      router.push('/dashboard');
    }
  }, [user, userData, loading, router]);

  // Fetch user data, properties, and notes
  const fetchData = useCallback(async () => {
    if (!user || !userId) return;
    setPageLoading(true);
    try {
      // Fetch user doc directly from client Firestore
      const { doc: docRef, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(docRef(db, 'users', userId));

      if (!userDoc.exists()) {
        router.push('/dashboard/admin');
        return;
      }

      setTargetUser({ id: userDoc.id, ...userDoc.data() });

      // Fetch properties
      const propsSnap = await getDocs(
        query(collection(db, 'properties'), where('userId', '==', userId))
      );
      let userProperties = propsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Also try with uid field
      if (userProperties.length === 0) {
        const propsSnap2 = await getDocs(
          query(collection(db, 'properties'), where('uid', '==', userId))
        );
        userProperties = propsSnap2.docs.map((d) => ({ id: d.id, ...d.data() }));
      }

      setProperties(userProperties);

      // Fetch notes
      await fetchNotes();
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setPageLoading(false);
    }
  }, [user, userId]);

  const fetchNotes = useCallback(async () => {
    if (!user || !userId) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes?adminUid=${user.uid}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  }, [user, userId]);

  useEffect(() => {
    if (user && userData?.superAdmin === true) {
      fetchData();
    }
  }, [user, userData, fetchData]);

  // Toggle user fields
  const handleToggle = async (field) => {
    if (!targetUser) return;
    setActionLoading(field);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUid: user.uid,
          targetUid: userId,
          updates: { [field]: !targetUser[field] },
        }),
      });

      if (res.ok) {
        setTargetUser((prev) => ({ ...prev, [field]: !prev[field] }));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Failed to update');
    } finally {
      setActionLoading(null);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!confirm(`Send password reset email to ${targetUser.email}?`)) return;
    setActionLoading('resetPassword');
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid: user.uid }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Password reset email sent!');
      } else {
        alert(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      alert('Failed to send reset email');
    } finally {
      setActionLoading(null);
    }
  };

  // API access actions
  const handleApiAction = async (action) => {
    setActionLoading(`api-${action}`);
    try {
      const res = await fetch('/api/admin/api-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid: user.uid, targetUid: userId, action }),
      });

      if (res.ok) {
        // Re-fetch the user to update apiAccess
        const { doc: docRef, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(docRef(db, 'users', userId));
        if (userDoc.exists()) {
          setTargetUser({ id: userDoc.id, ...userDoc.data() });
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      console.error('API action error:', err);
      alert('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Add note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid: user.uid, text: noteText }),
      });

      if (res.ok) {
        setNoteText('');
        await fetchNotes();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add note');
      }
    } catch (err) {
      console.error('Add note error:', err);
      alert('Failed to add note');
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid: user.uid, noteId }),
      });

      if (res.ok) {
        await fetchNotes();
      } else {
        alert('Failed to delete note');
      }
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  if (loading || !user || userData?.superAdmin !== true || pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">User not found</p>
      </div>
    );
  }

  const name = [targetUser.firstName, targetUser.lastName].filter(Boolean).join(' ') || 'No name';
  const totalViews = properties.reduce((sum, p) => sum + (p.stats?.views || 0), 0);
  const totalOpinions = properties.reduce((sum, p) => sum + (p.stats?.opinions || 0), 0);
  const activeCampaigns = properties.filter((p) => p.visibility === true).length;
  const apiStatus = targetUser.apiAccess?.status;
  const maskedKey = targetUser.apiAccess?.apiKey
    ? targetUser.apiAccess.apiKey.slice(0, 6) + '...' + targetUser.apiAccess.apiKey.slice(-4)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/dashboard/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(targetUser.firstName?.[0] || targetUser.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">{name}</h1>
              <p className="text-xs text-slate-500 truncate">{targetUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {targetUser.superAdmin && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700">ADMIN</span>
            )}
            {targetUser.pro && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700">PRO</span>
            )}
            {targetUser.isAgent && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">AGENT</span>
            )}
            {targetUser.isBuyer && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700">BUYER</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleResetPassword}
              disabled={actionLoading === 'resetPassword'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'resetPassword' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Reset Password
            </button>
            <button
              onClick={() => handleToggle('pro')}
              disabled={actionLoading === 'pro'}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                targetUser.pro
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {actionLoading === 'pro' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Star className="w-4 h-4" />
              )}
              {targetUser.pro ? 'Remove Pro' : 'Make Pro'}
            </button>
            <button
              onClick={() => handleToggle('superAdmin')}
              disabled={actionLoading === 'superAdmin'}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                targetUser.superAdmin
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {actionLoading === 'superAdmin' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
              {targetUser.superAdmin ? 'Remove Admin' : 'Make Admin'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Properties</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Total Views</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Total Opinions</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalOpinions}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Active Campaigns</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{activeCampaigns}</p>
          </div>
        </div>

        {/* Properties */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-600">Properties ({properties.length})</h2>
          </div>
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No properties</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {properties.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/property/${p.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group block"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.imageUrl || p.images?.[0] ? (
                      <img src={p.imageUrl || p.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {p.address || p.formattedAddress || 'No address'}
                    </p>
                    <p className="text-xs text-slate-500">{p.price || '--'}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {p.stats?.views || 0}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${
                    p.visibility ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {p.visibility ? 'Public' : 'Private'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-600">Admin Notes ({notes.length})</h2>
          </div>

          {/* Add note form */}
          <form onSubmit={handleAddNote} className="px-6 py-4 border-b border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={noteSubmitting || !noteText.trim()}
                className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {noteSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

          {notes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No notes yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notes.map((note) => (
                <div key={note.id} className="px-6 py-3 flex items-start gap-3 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{note.text}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {note.createdByName || 'Admin'} &middot; {formatDateWithTime(note.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Access Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-600">API Access</h2>
          </div>
          <div className="px-6 py-5">
            {!apiStatus || apiStatus === 'none' ? (
              <p className="text-sm text-slate-400">No API access requested</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    apiStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : apiStatus === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {apiStatus.charAt(0).toUpperCase() + apiStatus.slice(1)}
                  </span>
                </div>

                {maskedKey && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">API Key:</span>
                    <span className="font-mono text-sm text-slate-800 bg-slate-100 px-2 py-1 rounded">{maskedKey}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {(apiStatus === 'pending' || apiStatus === 'revoked') && (
                    <button
                      onClick={() => handleApiAction('approve')}
                      disabled={actionLoading === 'api-approve'}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'api-approve' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                  )}
                  {apiStatus === 'approved' && (
                    <>
                      <button
                        onClick={() => handleApiAction('revoke')}
                        disabled={actionLoading === 'api-revoke'}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === 'api-revoke' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldX className="w-4 h-4" />
                        )}
                        Revoke
                      </button>
                      <button
                        onClick={() => handleApiAction('regenerate')}
                        disabled={actionLoading === 'api-regenerate'}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === 'api-regenerate' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Key className="w-4 h-4" />
                        )}
                        Regenerate Key
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Joined date */}
        <div className="text-center text-xs text-slate-400 py-4">
          Joined {formatDate(targetUser.createdAt)}
        </div>
      </div>
    </div>
  );
}
