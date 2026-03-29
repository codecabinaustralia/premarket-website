'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  Clock,
  Check,
  X,
  Copy,
  LinkIcon,
  ExternalLink,
  ChevronRight,
  Play,
  Monitor,
  MousePointer,
  Type,
  Globe,
} from 'lucide-react';
import { useToast } from '../ToastProvider';
import useConfirm from '../../hooks/useConfirm';
import { formatDateWithTime, formatDuration, parseUserAgent } from '../../utils/formatters';

export default function DocsAnalyticsTab({ user, userData }) {
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
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
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../../../firebase/clientApp');

      const queryRef = query(collection(db, 'docSessions'), where('linkToken', '==', linkToken));
      const snapshot = await getDocs(queryRef);
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
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeactivate = async (token) => {
    const ok = await confirm({
      title: 'Deactivate Link',
      message: 'Deactivate this link? Visitors will no longer be able to access docs with it.',
      confirmLabel: 'Deactivate',
      confirmVariant: 'danger',
    });
    if (!ok) return;
    setDeactivating(token);
    try {
      await fetch(`/api/docs/links/${token}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });
      toast.success('Link deactivated');
      await fetchLinks();
      if (selectedLink?.token === token) {
        setSelectedLink(null);
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to deactivate:', err);
      toast.error('Failed to deactivate link');
    } finally {
      setDeactivating(null);
    }
  };

  // Session detail view
  if (selectedSession) {
    return (
      <>
        {ConfirmDialog}
        <DocsSessionDetailView
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      </>
    );
  }

  // Sessions list for a link
  if (selectedLink) {
    return (
      <div>
        {ConfirmDialog}
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
    <div>
      {ConfirmDialog}
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
