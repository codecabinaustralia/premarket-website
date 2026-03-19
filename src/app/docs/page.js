'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Users,
  Code,
  Home,
  UserCheck,
  FileText,
  Search,
  Key,
  List,
  Terminal,
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
  Database,
  Activity,
  Plug,
  LinkIcon,
  BarChart3,
  Copy,
  Check,
  Lock,
  TrendingUp,
  AlertCircle,
  Zap,
  DollarSign,
} from 'lucide-react';

/* ─── Sidebar Navigation Structure ─── */
const NAV_SECTIONS = [
  {
    group: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction', icon: BookOpen },
      { id: 'how-it-works', label: 'How It Works', icon: List },
    ],
  },
  {
    group: 'Solutions',
    items: [
      { id: 'price-education', label: 'Price Education', icon: TrendingUp },
      { id: 'the-problem', label: 'The Problem', icon: AlertCircle },
      { id: 'the-data-engine', label: 'The Data Engine', icon: Zap },
      { id: 'the-business', label: 'The Business', icon: DollarSign },
    ],
  },
  {
    group: 'User Journeys',
    items: [
      { id: 'listing-agents', label: 'Listing Agents', icon: UserCheck },
      { id: 'buyers-agents', label: "Buyer's Agents", icon: Search },
      { id: 'sellers', label: 'Sellers', icon: Home },
      { id: 'buyers', label: 'Buyers', icon: Users },
    ],
  },
  {
    group: 'Product',
    items: [
      { id: 'core-insight', label: 'Core Insight', icon: Activity },
      { id: 'the-flywheel', label: 'The Flywheel', icon: Database },
      { id: 'integrations', label: 'Integrations', icon: Plug },
    ],
  },
  {
    group: 'Market Intelligence',
    items: [
      { id: 'data-advantage', label: 'The Data Advantage', icon: Database },
      { id: 'api-overview', label: 'API Overview', icon: Code },
      { id: 'authentication', label: 'Authentication', icon: Key },
      { id: 'endpoints', label: 'Endpoints', icon: FileText },
      { id: 'code-examples', label: 'Code Examples', icon: Terminal },
    ],
  },
];

const ALL_IDS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.id));

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/buyer-score',
    description: 'Buyer intent score (0-100) for a location',
    params: 'location, suburb, state, postcode, lat, lng, radius',
  },
  {
    method: 'GET',
    path: '/api/v1/seller-score',
    description: 'Seller intent score (0-100) for a location',
    params: 'location, suburb, state, postcode, lat, lng, radius',
  },
  {
    method: 'GET',
    path: '/api/v1/market-forecast',
    description: 'Properties going to market, expected prices, demand indicator',
    params: 'location, suburb, state, postcode, lat, lng, radius',
  },
  {
    method: 'GET',
    path: '/api/v1/trending-areas',
    description: 'Top trending areas ranked by buyer activity growth',
    params: 'limit, country',
  },
  {
    method: 'GET',
    path: '/api/v1/historical-trends',
    description: 'Buyer/seller score trends over past months',
    params: 'location, suburb, state, postcode, lat, lng, radius, months',
  },
  {
    method: 'GET',
    path: '/api/v1/property-insights',
    description: 'Per-property views, opinions, likes, price vs opinion gap',
    params: 'location, suburb, state, postcode, lat, lng, radius',
  },
];

/* ─── Default export with Suspense wrapper ─── */
export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
        </div>
      }
    >
      <DocsGate />
    </Suspense>
  );
}

/* ─── Access Gate ─── */
function DocsGate() {
  const { user, userData, loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t');

  const [accessState, setAccessState] = useState('checking'); // checking | granted | denied | expired
  const [isTokenAccess, setIsTokenAccess] = useState(false);

  useEffect(() => {
    if (loading) return;

    const isAdmin = userData?.superAdmin === true;

    // Path 1: superAdmin — instant access, no recording
    if (isAdmin) {
      setAccessState('granted');
      setIsTokenAccess(false);
      return;
    }

    // Path 2: token present — validate it
    if (token) {
      fetch(`/api/docs/links/${token}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid) {
            setAccessState('granted');
            setIsTokenAccess(true);
          } else if (data.expired) {
            setAccessState('expired');
          } else {
            setAccessState('denied');
          }
        })
        .catch(() => setAccessState('denied'));
      return;
    }

    // Path 3: no admin, no token — redirect
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/join');
    }
  }, [loading, user, userData, token, router]);

  if (loading || accessState === 'checking') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (accessState === 'expired') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link Expired</h1>
          <p className="text-slate-500 text-sm mb-6">This link has expired after 72 hours. Please request a new link to access the documentation.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (accessState === 'denied') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500 text-sm mb-6">This link is no longer active or is invalid.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = userData?.superAdmin === true;

  return (
    <DocsContent
      isAdmin={isAdmin}
      isTokenAccess={isTokenAccess}
      linkToken={token}
      user={user}
    />
  );
}

/* ─── Generate Link Modal ─── */
function GenerateLinkModal({ uid, onClose }) {
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/docs/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, label: label.trim() || undefined }),
      });
      const data = await res.json();
      if (data.url) {
        setGeneratedUrl(data.url);
      }
    } catch (err) {
      console.error('Failed to create link:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 mb-4">Generate Trackable Link</h3>

        {!generatedUrl ? (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Investor A, Board Meeting"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-3">Share this link to grant tracked access:</p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
              <code className="text-xs text-slate-700 flex-1 break-all font-mono">{generatedUrl}</code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Docs Content ─── */
function DocsContent({ isAdmin, isTokenAccess, linkToken, user }) {
  const [activeSection, setActiveSection] = useState('introduction');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const isScrollingTo = useRef(false);

  // ─── Session Recording (token access only) ───
  const sessionIdRef = useRef(null);
  const viewedSectionsRef = useRef(new Set());
  const interactionsRef = useRef([]);
  const rrwebEventsRef = useRef([]);
  const startedAtRef = useRef(null);
  const stopRecordRef = useRef(null);
  const heartbeatRef = useRef(null);

  const flushSession = useCallback(() => {
    if (!isTokenAccess || !linkToken || !sessionIdRef.current) return;

    const duration = startedAtRef.current
      ? Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000)
      : 0;

    const payload = {
      linkToken,
      sessionId: sessionIdRef.current,
      startedAt: startedAtRef.current,
      duration,
      sectionsViewed: [...viewedSectionsRef.current],
      interactions: interactionsRef.current.slice(-500),
      recording: rrwebEventsRef.current,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
    };

    // Use sendBeacon for unload, fetch otherwise
    if (document.visibilityState === 'hidden') {
      navigator.sendBeacon(
        '/api/docs/sessions',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } else {
      fetch('/api/docs/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  }, [isTokenAccess, linkToken]);

  useEffect(() => {
    if (!isTokenAccess) return;

    sessionIdRef.current = crypto.randomUUID();
    startedAtRef.current = new Date().toISOString();

    // Start rrweb recording
    import('rrweb').then(({ record }) => {
      stopRecordRef.current = record({
        emit: (event) => {
          rrwebEventsRef.current.push(event);
        },
      });
    });

    // Click tracking
    const handleClick = (e) => {
      const heading = e.target.closest('h1, h2, h3, h4, section');
      const target = heading?.textContent?.slice(0, 100) || e.target.textContent?.slice(0, 100) || '';
      interactionsRef.current.push({
        type: 'click',
        target,
        timestamp: Date.now(),
      });
    };
    document.addEventListener('click', handleClick);

    // Selection tracking
    const handleSelection = () => {
      const text = document.getSelection()?.toString()?.trim();
      if (text && text.length > 2) {
        interactionsRef.current.push({
          type: 'selection',
          target: text.slice(0, 200),
          timestamp: Date.now(),
        });
      }
    };
    document.addEventListener('selectionchange', handleSelection);

    // Heartbeat every 30s
    heartbeatRef.current = setInterval(() => {
      flushSession();
    }, 30000);

    // Visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Beforeunload
    const handleUnload = () => {
      flushSession();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (stopRecordRef.current) stopRecordRef.current();
      clearInterval(heartbeatRef.current);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      flushSession();
    };
  }, [isTokenAccess, flushSession]);

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    const observers = [];
    const visibleSections = new Set();

    ALL_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (isScrollingTo.current) return;
          if (entry.isIntersecting) {
            visibleSections.add(id);
            // Track viewed section for recording
            if (isTokenAccess) {
              viewedSectionsRef.current.add(id);
            }
          } else {
            visibleSections.delete(id);
          }
          for (const sectionId of ALL_IDS) {
            if (visibleSections.has(sectionId)) {
              setActiveSection(sectionId);
              break;
            }
          }
        },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [isTokenAccess]);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    isScrollingTo.current = true;
    setActiveSection(id);
    setSidebarOpen(false);

    const y = el.getBoundingClientRect().top + window.scrollY - 32;
    window.scrollTo({ top: y, behavior: 'smooth' });

    window.history.replaceState(null, '', `#${id}`);

    setTimeout(() => {
      isScrollingTo.current = false;
    }, 800);
  }, []);

  // Handle initial hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && ALL_IDS.includes(hash)) {
      setTimeout(() => scrollTo(hash), 100);
    }
  }, [scrollTo]);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-50 border-r border-slate-200 z-30">
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-200">
            <Link href="/">
              <Image
                src="https://premarketvideos.b-cdn.net/assets/logo.png"
                alt="Premarket"
                width={130}
                height={32}
                className="h-6 w-auto"
                unoptimized
              />
            </Link>
          </div>

          <div className="px-4 pt-4 pb-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          </div>

          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            {NAV_SECTIONS.map((section) => (
              <div key={section.group} className="mb-5">
                <p className="px-3 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.group}
                </p>
                {section.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'text-orange-600 font-medium bg-orange-50 border-l-2 border-orange-500 -ml-px'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* ─── Mobile Header ─── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <span className="text-sm font-semibold text-slate-900">Documentation</span>
          <Link href="/dashboard" className="p-2 -mr-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
        </div>
      </div>

      {/* ─── Mobile Sidebar Overlay ─── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-slate-50 border-r border-slate-200 z-50 lg:hidden overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <Link href="/">
                <Image
                  src="https://premarketvideos.b-cdn.net/assets/logo.png"
                  alt="Premarket"
                  width={120}
                  height={30}
                  className="h-6 w-auto"
                  unoptimized
                />
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="px-4 pt-4 pb-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </Link>
            </div>
            <nav className="px-3 py-2">
              {NAV_SECTIONS.map((section) => (
                <div key={section.group} className="mb-5">
                  <p className="px-3 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section.group}
                  </p>
                  {section.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollTo(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActive
                            ? 'text-orange-600 font-medium bg-orange-50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* ─── Main Content ─── */}
      <main className="lg:pl-60">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-12 lg:py-16">

          {/* ════════════════════════════════════════ */}
          {/* GETTING STARTED                          */}
          {/* ════════════════════════════════════════ */}

          <section id="introduction" className="scroll-mt-20">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
              Premarket Documentation
            </h1>
            <p className="text-slate-600 leading-relaxed mb-4">
              Premarket is a platform built on a single idea: <span className="font-medium text-slate-900">a home is worth what a buyer would pay for it</span> — not what the house across the street sold for two months ago. We call this Price Education backed by data, and it&apos;s the foundation of everything the platform does.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              The platform connects listing agents, sellers, buyers, and buyer&apos;s agents before a property goes to market — replacing guesswork, gut feel, and backward-looking estimates with live buyer evidence. Every interaction — every price opinion submitted, every property saved, every interest registered — creates a real-time signal about what the market would pay today, not what it paid last quarter.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              This documentation covers the{' '}
              <button onClick={() => scrollTo('price-education')} className="text-orange-600 hover:text-orange-700 underline">
                problem Premarket solves
              </button>
              , the{' '}
              <button onClick={() => scrollTo('the-data-engine')} className="text-orange-600 hover:text-orange-700 underline">
                data engine
              </button>
              {' '}that powers it, how each stakeholder interacts with the platform, the product mechanics that drive value for all participants, and the Market Intelligence API for developers building on top of Premarket&apos;s data layer.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mt-6">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">New to Premarket?</span> Start with{' '}
                <button onClick={() => scrollTo('price-education')} className="underline hover:no-underline">
                  Price Education
                </button>{' '}
                to understand the problem we solve, or jump to{' '}
                <button onClick={() => scrollTo('how-it-works')} className="underline hover:no-underline">
                  How It Works
                </button>{' '}
                for a quick overview of the process.
              </p>
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* How It Works */}
          <section id="how-it-works" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              Premarket follows a simple process that takes a property from private campaign to confident listing decision. Each step generates data that benefits every participant in the transaction.
            </p>

            <ol className="space-y-6">
              {[
                {
                  title: 'Agent creates a campaign',
                  desc: 'The listing agent creates a pre-market campaign using the native app or desktop dashboard — photos, property details, optional guide price, and a short description. Takes about 1–2 minutes. The agent chooses whether to keep the campaign private or showcase it on the Premarket website.',
                },
                {
                  title: 'Agent distributes the campaign',
                  desc: 'The agent shares the campaign link to their buyer database, buyer\'s agents, active buyers, via SMS and email campaigns, and through CRM integrations. This targeted distribution means the right buyers see the property immediately.',
                },
                {
                  title: 'Buyers engage and provide feedback',
                  desc: 'Buyers and buyer\'s agents discover the property, submit price opinions (what they\'d genuinely pay), register interest, and save it to their shortlist. Each interaction creates a real buyer evaluation of the property — the core data asset.',
                },
                {
                  title: 'Live vendor report builds automatically',
                  desc: 'Premarket compiles engagement into a live report: price opinion distribution, median buyer value, interest signals, and activity trends. This is price education backed by data — the seller sees what real buyers would actually pay, not what an algorithm estimates based on past sales.',
                },
                {
                  title: 'Agent educates on price with evidence',
                  desc: 'Armed with buyer data instead of estimates, the agent can confidently educate the seller on price. The conversation shifts from "trust my opinion" to "look at what buyers are telling us." This is the core of what Premarket enables — credible, evidence-based price education that aligns expectations with reality.',
                },
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* ════════════════════════════════════════ */}
          {/* SOLUTIONS                                */}
          {/* ════════════════════════════════════════ */}

          {/* Price Education — hero-style header */}
          <section id="price-education" className="scroll-mt-20">
            <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-10 mb-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
              <div className="relative">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Solutions</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Price Education backed by data.
                </h2>
                <p className="text-slate-300 leading-relaxed max-w-2xl">
                  Real estate has a pricing problem. Sellers have expectations. Agents have opinions. Buyers have budgets. Until now, there was no single source of truth to align them. Premarket changes that by replacing gut feel and guesswork with live buyer evidence — the only data that actually determines what a home is worth.
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed mb-4">
              The most valuable thing an agent can do for a seller is not find a buyer — it&apos;s educate them on price. But price education has always been built on shaky foundations: comparable sales that may no longer be relevant, algorithm-driven estimates that extrapolate from the past, and ultimately, the agent&apos;s professional judgement — which the seller may or may not trust.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Premarket creates a fundamentally different kind of price education. One built on what buyers would actually pay <span className="font-medium text-slate-900">right now</span>, for <span className="font-medium text-slate-900">this specific property</span>, based on <span className="font-medium text-slate-900">their direct input</span>. Not a statistical model. Not a prediction. Live market evidence from the people who would write the cheque.
            </p>
            <p className="text-slate-600 leading-relaxed">
              When the pricing conversation is backed by buyer data rather than agent opinion, everything changes. The awkward conversations disappear. Unrealistic expectations get corrected by evidence, not arguments. And the agent transforms from someone with an opinion into someone with proof.
            </p>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* The Problem */}
          <section id="the-problem" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">The Problem</h2>
            <p className="text-lg text-slate-500 mb-6">The pricing conversation in real estate is broken — and everyone knows it.</p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Unrealistic expectations</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Every agent has been in this situation. A seller is convinced their home is worth $1.5 million because their neighbour sold for $1.4 million six months ago — and their kitchen is nicer. The agent knows the market has shifted. Interest rates have moved. Buyer sentiment has changed. But the seller has anchored to a number, and no amount of professional advice will shift it.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              This isn&apos;t a rare edge case. It&apos;s the default dynamic in the majority of listing conversations. Sellers overestimate because they&apos;re emotionally invested, because they&apos;ve seen headlines, because they&apos;ve checked an online estimate, or simply because they need a certain number to make their next move work. The agent is stuck trying to correct expectations using the same tools the seller has already seen — and didn&apos;t believe.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">The awkward conversation</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              The hardest part of being a listing agent isn&apos;t finding buyers. It&apos;s the conversation where you tell a seller their home is worth less than they think. It&apos;s adversarial by nature — the agent appears to be arguing <em>against</em> the seller&apos;s interest, even when they&apos;re trying to protect it.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Agents lose listings over this conversation. They either tell the truth and lose to an agent who inflates the number, or they agree to an unrealistic price and spend weeks watching the campaign fail. Neither outcome is good for anyone. The root cause is always the same: the agent has no independent, credible evidence to support their pricing recommendation. It&apos;s their word against the seller&apos;s hopes.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Static photos collecting dust, not data</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Walk past any real estate office and look at the window. Static photos of properties. No engagement data. No buyer feedback. No indication of demand. The same image sits there for weeks — a poster in a glass case, doing nothing.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              The same is true of most digital advertising. A property is listed with photos and a price guide. Buyers either enquire or they don&apos;t. There&apos;s no middle ground — no mechanism to capture the buyer who looked, considered, and had a view on price but wasn&apos;t ready to call. That buyer&apos;s insight is lost entirely. Every impression that doesn&apos;t convert to an enquiry is wasted. The photos collect views, not intelligence. Dust, not data.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Backward-looking data in a forward-moving market</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              The industry&apos;s current answer to price education is historical data. CoreLogic, Pricefinder, RPData — they all work the same way. They take past transactions, apply statistical models, and project a current estimate. The house down the street sold for $X three months ago, so this one should be worth approximately $Y.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              The fundamental flaw is obvious: <span className="font-medium text-slate-900">they&apos;re using the past to predict the future.</span> In a stable market, this works reasonably well. But markets aren&apos;t stable. Interest rates move. Buyer sentiment shifts. Supply changes. Seasonal patterns disrupt. By the time a comparable sale is recorded, settled, and published, the market conditions that produced it no longer exist.
            </p>

            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-6">
              <p className="text-sm text-red-800">
                <span className="font-semibold">The core problem.</span> A home is worth what a buyer would pay for it — not what the house across the street sold for two months ago. The entire industry prices property based on lagging indicators, and then wonders why seller expectations are misaligned with market reality.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Current approach</p>
                <div className="space-y-2.5">
                  {[
                    'Comparable sales from months ago',
                    'Statistical models extrapolating trends',
                    'Agent opinion vs seller expectation',
                    'Static advertising with zero feedback',
                    'No data captured from non-enquiring buyers',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border-2 border-orange-200 bg-orange-50/30 p-5">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-3">Premarket approach</p>
                <div className="space-y-2.5">
                  {[
                    'Live buyer price opinions in real time',
                    'Direct data from qualified buyers',
                    'Evidence replaces opinion in conversations',
                    'Every view generates usable data',
                    'Non-enquiring buyers still contribute value',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* The Data Engine */}
          <section id="the-data-engine" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">The Data Engine</h2>
            <p className="text-lg text-slate-500 mb-6">Live buyer feedback — the only real-time valuation signal in real estate.</p>

            <p className="text-slate-600 leading-relaxed mb-4">
              At the centre of Premarket is a data warehouse that operates fundamentally differently from every other real estate data provider. It doesn&apos;t scrape public listings. It doesn&apos;t wait for settlements to record a price. It doesn&apos;t extrapolate from historical trends.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              <span className="font-medium text-slate-900">It captures what buyers would pay, right now, for a specific property, directly from the buyers themselves.</span>
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">How the engine works</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              When an agent creates a pre-market campaign and distributes it to their buyer network, every interaction generates a data point. A buyer views the property — that&apos;s a signal. They save it — stronger signal. They submit a price opinion — that&apos;s a direct valuation from a real market participant. They register interest — that&apos;s confirmed demand.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Aggregate these signals across every campaign, every property, every suburb, and you have something that has never existed before in real estate: a live, continuously updating picture of buyer demand and property value, sourced directly from the people who would actually buy.
            </p>

            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 p-6 sm:p-8 mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Why this is more accurate than CoreLogic</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                CoreLogic is the industry standard. Agents use it. Banks use it. It powers automated valuations across Australia. But CoreLogic has an inherent limitation: <span className="font-medium text-slate-900">it can only tell you what already happened.</span>
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                CoreLogic collects settlement data — properties that sold, the price they sold for, and the characteristics of those properties. It then applies hedonic regression models, median price calculations, and automated valuation methodologies to estimate what a similar property might be worth today. It&apos;s backward-looking by design. It uses the past to predict the future.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                <span className="font-medium text-slate-900">Premarket does the opposite.</span> Instead of looking backward at what sold, it looks forward at what buyers would pay. Instead of modelling from comparable sales, it captures direct input from actual market participants. Instead of publishing quarterly updates, it updates continuously — in real time, as buyers engage.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-white border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">CoreLogic</p>
                  <div className="space-y-2">
                    {[
                      ['Source', 'Settlement records (past transactions)'],
                      ['Timing', 'Weeks to months after a sale'],
                      ['Method', 'Statistical models & extrapolation'],
                      ['Updates', 'Monthly or quarterly'],
                      ['Tells you', 'What similar homes sold for'],
                    ].map(([label, value], i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-medium text-slate-500 w-16 flex-shrink-0 mt-0.5">{label}</span>
                        <span className="text-xs text-slate-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-white border-2 border-orange-200 p-4">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-3">Premarket</p>
                  <div className="space-y-2">
                    {[
                      ['Source', 'Buyer price opinions (direct input)'],
                      ['Timing', 'Real time, as buyers engage'],
                      ['Method', 'Direct measurement, not modelling'],
                      ['Updates', 'Continuously, with every interaction'],
                      ['Tells you', 'What buyers would pay today'],
                    ].map(([label, value], i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-medium text-slate-500 w-16 flex-shrink-0 mt-0.5">{label}</span>
                        <span className="text-xs text-slate-700 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">The data comes from buyers — that&apos;s the entire point</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Every other data provider in real estate is one or more steps removed from the actual buyer. CoreLogic sees a settlement record weeks after the fact. Pricefinder sees a listing price that may bear no relation to the final sale. Domain and REA see search behaviour — clicks and saves — but never a price opinion. None of them capture what a buyer would actually pay.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Premarket goes directly to the source. When a buyer submits a price opinion, they&apos;re telling you — in real terms — what this property is worth to them. Multiply that across dozens of buyers for a single property, and you have a statistically meaningful valuation built entirely from primary data. Not modelled. Not inferred. Measured.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              This is why the accuracy is higher. It&apos;s not a better algorithm — it&apos;s a better data source. The algorithm doesn&apos;t need to be clever when the input is already the answer. Buyers <em>are</em> the market. Their opinions <em>are</em> the value. Premarket simply captures that signal in a structured, scalable way.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">What the engine produces</h3>
            <div className="space-y-3 mb-8">
              {[
                ['Per-property valuations', 'Median buyer price opinion, price distribution, opinion count, and confidence score — for individual properties, updated in real time.'],
                ['Suburb-level demand signals', 'Aggregated buyer intent by location — which suburbs are heating up, which are cooling, and where demand is concentrated.'],
                ['Trend data', 'How buyer sentiment and pricing opinions are shifting over time — weekly, monthly, and quarterly trends at every geographic level.'],
                ['Price gap analysis', 'The gap between what sellers expect and what buyers would pay — the single most useful metric for price education.'],
                ['Forward-looking market forecasts', 'Which properties are likely to come to market, what buyers would pay for them, and where demand exceeds supply — predictive intelligence that backward-looking data cannot provide.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <span className="font-medium text-slate-900">{title}.</span> {desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">The compounding effect.</span> Every new campaign, every new buyer, every new price opinion makes the engine more accurate and more valuable. This is a dataset that cannot be replicated by scraping public records or modelling historical sales. It can only be built by capturing real buyer intent at scale — and that requires the platform, the agent network, and the buyer engagement that Premarket has built.
              </p>
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* The Business */}
          <section id="the-business" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">The Business</h2>
            <p className="text-lg text-slate-500 mb-6">How it works, how it makes money, and where the real value sits.</p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">The How — agents and their database</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              The distribution engine behind Premarket is the agent and their existing buyer database. Agents don&apos;t need to build a new audience. They already have one — years of contacts, active buyers from past campaigns, buyer&apos;s agents they work with regularly, and CRM databases full of qualified prospects.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              When an agent creates a pre-market campaign, they share it through channels they already control: SMS, email, CRM workflows, and direct outreach. The agent is the distribution channel. Their database is the audience. Premarket provides the platform that turns those existing relationships into structured, usable market data.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              This is why adoption scales efficiently. Agents aren&apos;t being asked to do something new. They&apos;re being asked to do what they already do — share properties with buyers — through a tool that captures data they&apos;ve never been able to capture before.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">The Cashflow — vendor-paid fees</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Revenue comes from the seller. When an agent creates a pre-market campaign, the vendor pays a campaign fee. This aligns incentives perfectly: the seller pays for market intelligence about their own property, the agent gets a tool that helps them win and retain listings, and the buyer participates for free — which is critical for data quality and volume.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              The fee is a fraction of traditional marketing spend. A seller might pay $10,000–$30,000 for a full marketing campaign (photography, styling, portal listings, print advertising) with no guarantee of success. A Premarket campaign costs significantly less and delivers actionable intelligence before the seller commits to anything else.
            </p>

            <div className="rounded-lg border border-slate-200 overflow-hidden mb-8">
              <div className="divide-y divide-slate-200">
                {[
                  ['Campaign fee', 'Vendor pays per pre-market campaign — the primary revenue driver'],
                  ['Subscription', 'Agents subscribe for premium features, advanced analytics, and priority support'],
                  ['API access', 'Developers and platforms pay for access to the Market Intelligence API'],
                ].map(([item, desc], i) => (
                  <div key={i} className="flex items-start gap-4 px-4 py-3">
                    <span className="flex-shrink-0 w-28 text-sm font-medium text-slate-900">{item}</span>
                    <p className="text-sm text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">The Value — the data is the company</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Campaign fees drive cashflow. But the real value of Premarket is the data engine underneath.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Every campaign generates buyer price opinions. Every price opinion is a primary data point that no other company in real estate has. Aggregated across thousands of properties and suburbs, this becomes a proprietary dataset of live buyer valuations — a forward-looking valuation layer that covers the entire market and improves with every interaction.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              The cashflow comes from fees. The value of the company comes from owning the most accurate, most current, and most direct source of property valuation data in the market. A dataset that cannot be replicated by scraping, modelling, or extrapolating. It can only be built by capturing real buyer intent at scale.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              And the output of that data is what makes everything work: <span className="font-medium text-slate-900">the ability to educate on price — confidently, credibly, and backed by evidence.</span> That&apos;s what agents need. That&apos;s what sellers need. And that&apos;s what Premarket delivers.
            </p>

            <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
              <div className="relative">
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">The How</p>
                    <p className="text-white font-medium mb-1">Agents &amp; their database</p>
                    <p className="text-slate-400 text-sm">Existing relationships become structured market data through the platform.</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">The Cashflow</p>
                    <p className="text-white font-medium mb-1">Vendor-paid fees</p>
                    <p className="text-slate-400 text-sm">Sellers pay for market intelligence. Buyers participate free. Incentives align.</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">The Value</p>
                    <p className="text-white font-medium mb-1">The data &amp; its accuracy</p>
                    <p className="text-slate-400 text-sm">A proprietary, forward-looking valuation layer that improves with every interaction.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* ════════════════════════════════════════ */}
          {/* USER JOURNEYS                            */}
          {/* ════════════════════════════════════════ */}

          {/* Listing Agents */}
          <section id="listing-agents" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Listing Agents</h2>
            <p className="text-lg text-slate-500 mb-6">Educate sellers on price with buyer evidence — not opinions, not comparables, not guesswork.</p>

            <p className="text-slate-600 leading-relaxed mb-4">
              In competitive markets, listing agents are typically pitching against two or three other agencies for the same property. Every agent offers marketing. Every agent has comparables. Every agent has an opinion on price. But opinions create friction — especially when they don&apos;t match what the seller wants to hear. The agent who tells the truth risks losing the listing. The agent who inflates the number wins the pitch but fails the campaign.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Premarket changes this dynamic entirely. Instead of asking a vendor to trust an appraisal built on what similar homes sold for months ago, the agent presents{' '}
              <button onClick={() => scrollTo('the-data-engine')} className="text-orange-600 hover:text-orange-700 underline">
                live buyer evidence
              </button>
              {' '} — real price opinions from qualified buyers, genuine interest signals, and a data-driven view of what the market would pay today. The conversation shifts from &ldquo;trust me&rdquo; to &ldquo;look at what buyers are telling us.&rdquo;
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              This is{' '}
              <button onClick={() => scrollTo('price-education')} className="text-orange-600 hover:text-orange-700 underline">
                Price Education backed by data
              </button>
              {' '}in practice. The agent doesn&apos;t need to convince the seller — the buyer data does that. And because the data comes directly from buyers rather than from historical sales or algorithms, it carries a credibility that no comparable sale or automated valuation can match.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4">The agent journey</h3>

            <div className="space-y-6 mb-8">
              <div>
                <h4 className="font-medium text-slate-900 mb-1">1. Identify the opportunity</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-2">
                  The agent identifies a potential seller — a homeowner thinking about selling, an investor uncertain about price, a privacy-focused vendor who doesn&apos;t want their property on the portals, or a listing the agent has been chasing for months. The agent introduces Premarket as a way to test the market privately before committing to anything.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">2. Create the campaign</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-2">
                  Using the native agent app or the desktop dashboard, the agent creates a pre-market campaign in about 1–2 minutes. They upload photos, enter the suburb and property details, set an optional guide price, and write a short description. The agent controls whether the listing stays private (link-only access) or is showcased on the Premarket website.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">3. Distribute the campaign link</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-2">
                  The agent shares the campaign to their buyer database, buyer&apos;s agents in the area, active buyers from past campaigns, and through SMS, email, and CRM integrations. This targeted distribution puts the property in front of the right people immediately — without a portal listing, without marketing spend, and without public exposure.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">4. Buyers provide feedback</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-2">
                  Buyers interact with the property by submitting price opinions — what they&apos;d genuinely be willing to pay — and registering their interest. This creates the core data: a real buyer evaluation of the property, independent of the agent&apos;s appraisal.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">5. The vendor report builds live</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-2">
                  Premarket compiles everything into a live dashboard for the seller: price opinion distribution, median buyer value, buyer interest signals, and engagement trends. The seller sees a real-time picture of their property&apos;s market position — built entirely from buyer behaviour, not agent estimates.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mt-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">This is price education in action.</span> The listing conversation is no longer agent opinion vs seller expectation. It becomes buyer evidence — data from the people who would actually write the cheque. That&apos;s very difficult to argue with.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">6. Progress the sale with data</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The agent now has multiple paths forward: secure the listing with a confident recommendation, set a guide price validated by real buyers, negotiate an off-market deal if a strong offer materialises, or transition into a full marketing campaign with proven demand already in hand.
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Why agents choose Premarket</h3>
            <div className="space-y-3 mb-2">
              {[
                ['Win listings', 'Competing agents offer marketing and opinions. Premarket agents offer price education backed by buyer data — a fundamentally different pitch that sellers trust.'],
                ['Differentiation', 'The agent has a tool that produces live buyer evidence no other agency can replicate. Not comparables. Not estimates. Direct buyer valuations.'],
                ['End awkward conversations', 'When buyers determine the value — not the agent — the most adversarial part of the listing conversation disappears. The data does the educating.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <span className="font-medium text-slate-900">{title}.</span> {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* Buyer's Agents */}
          <section id="buyers-agents" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Buyer&apos;s Agents</h2>
            <p className="text-lg text-slate-500 mb-6">Access exclusive opportunities and provide independent price insight to clients.</p>

            <p className="text-slate-600 leading-relaxed mb-4">
              Buyer&apos;s agents live and die by access. Their clients expect them to find properties before the general market, negotiate better deals, and provide professional pricing insight. Premarket gives them a dedicated channel to do exactly that — a stream of properties that haven&apos;t hit the portals yet, with the ability to engage directly with selling agents before the competition arrives.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              For buyer&apos;s agents, premarket access isn&apos;t just a convenience — it&apos;s a competitive advantage they use to attract and retain clients.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4">The buyer&apos;s agent journey</h3>

            <div className="space-y-6 mb-8">
              <div>
                <h4 className="font-medium text-slate-900 mb-1">1. Search and filter</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The buyer&apos;s agent logs into the web platform and filters by suburb, price range, property type, and bedroom/bathroom count — matching properties against their active client briefs. They&apos;re looking for opportunities that haven&apos;t surfaced on public portals.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">2. Analyse the property</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The buyer&apos;s agent reviews the listing — photos, property details, and agent notes — then cross-references with their own tools: CoreLogic, Pricefinder, comparable sales data. This dual analysis gives them a well-informed independent view of value before making any move.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">3. Submit a pricing opinion</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The buyer&apos;s agent submits their independent valuation opinion — a professional assessment of what the property is worth. This positions them as a credible, informed participant and signals to the selling agent that there&apos;s serious interest from a qualified party.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">4. Engage the selling agent</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The buyer&apos;s agent contacts the selling agent directly — discuss their client&apos;s interest, arrange a private inspection, and begin negotiating early. This happens while the property is still in its pre-market phase, before public competition has a chance to build.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">5. Secure the deal before market</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The possible outcomes are an off-market purchase, an early negotiated agreement, or at minimum a strong position prepared for when the campaign goes public. The buyer&apos;s agent&apos;s client gets first-mover advantage — the kind of access that justifies their fee.
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Why buyer&apos;s agents choose Premarket</h3>
            <div className="space-y-3 mb-2">
              {[
                ['Client attraction', 'Clients expect their buyer\'s agent to have access to off-market and pre-market deals. Premarket delivers that consistently.'],
                ['Reduced competition', 'Properties in the pre-market phase have a fraction of the buyer interest they\'ll attract once publicly listed. Less competition means better outcomes.'],
                ['Shape the data', 'Every price opinion a buyer\'s agent submits feeds the data engine that powers price education for agents and sellers. Their professional valuations carry weight — and contribute to the most accurate pricing dataset in real estate.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <span className="font-medium text-slate-900">{title}.</span> {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* Sellers */}
          <section id="sellers" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sellers</h2>
            <p className="text-lg text-slate-500 mb-6">See what buyers would actually pay — before committing to anything.</p>

            <p className="text-slate-600 leading-relaxed mb-4">
              Sellers face a fundamental problem: they have to commit significant time, money, and emotional energy to a marketing campaign before they know whether the market will meet their expectations. Photography, styling, advertising spend, open homes — all before a single offer comes in. If the campaign fails, the property sits on the portals with a stale listing and a damaged perception.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              The root cause is a lack of price education. Sellers set expectations based on online estimates, neighbour conversations, and emotional attachment — none of which reflect what today&apos;s buyers would actually pay. By the time the market corrects those expectations, the seller has already spent thousands and weeks of time.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Premarket eliminates that risk by delivering{' '}
              <button onClick={() => scrollTo('price-education')} className="text-orange-600 hover:text-orange-700 underline">
                price education backed by data
              </button>
              {' '}before the seller commits to anything. Real buyer price opinions. Genuine interest signals. A live view of what the market would pay — not what an algorithm thinks it should be worth.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4">The seller journey</h3>

            <div className="space-y-6 mb-8">
              <div>
                <h4 className="font-medium text-slate-900 mb-1">1. The seller has concerns</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The seller is thinking about selling but has common reservations: they&apos;re unsure about price, don&apos;t want to pay for marketing before knowing it&apos;ll work, have privacy concerns about their property being publicly listed, or simply aren&apos;t ready to fully commit.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">2. Their agent introduces Premarket</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The agent explains the concept: &ldquo;We can test the market privately first.&rdquo; No public listing, no portal footprint, no marketing spend. The property goes out to qualified buyers only, and the seller sees exactly how the market responds — with real data, not forecasts.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">3. The campaign runs privately</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The agent creates and distributes the campaign. Privacy is maintained — there&apos;s no portal listing, no public footprint. For high-value sellers particularly, this is critical. A failed public campaign can damage a property&apos;s market perception for months. A private pre-market campaign carries none of that risk.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">4. The seller receives price education</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  As buyers engage, the seller sees the data build in real time: how many buyers have viewed the property, their price opinions, the median buyer value, and the level of registered interest. This is price education in its purest form — not an agent&apos;s estimate, not an algorithm projecting from past sales. Real buyers telling you what they&apos;d pay, right now, for your property.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">5. Confidence builds</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The seller now has evidence that real buyers exist at achievable prices. The uncertainty that was holding them back — &ldquo;Will anyone pay what I need?&rdquo; — gets answered with data. The emotional decision to sell becomes an informed one.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">6. The seller proceeds on their terms</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  With evidence in hand, the seller can accept a pre-market offer if one materialises, move to a full on-market campaign with proven demand already in hand, or decide to hold if the timing isn&apos;t right — all without having spent a dollar or exposed their property publicly.
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Why sellers choose Premarket</h3>
            <div className="space-y-3 mb-2">
              {[
                ['Price education before commitment', 'Sellers see what real buyers would pay — direct price opinions, not estimates — before spending anything on marketing or making any public commitment.'],
                ['Privacy', 'No portal listing, no public exposure, no risk of a stale listing damaging perception. Static photos in office windows collect dust. Premarket campaigns collect data.'],
                ['Buyer-determined value', 'Price opinions come directly from buyers — not algorithms extrapolating from past sales, not agent appraisals. A home is worth what a buyer would pay. Premarket measures exactly that.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <span className="font-medium text-slate-900">{title}.</span> {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* Buyers */}
          <section id="buyers" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Buyers</h2>
            <p className="text-lg text-slate-500 mb-6">Discover properties before the crowd and become an active market participant.</p>

            <p className="text-slate-600 leading-relaxed mb-4">
              In most real estate markets, buyers are passive participants. They wait for properties to appear on the portals, compete at overcrowded auctions, and react to prices set by others. By the time a buyer finds a property they like, there are already dozens of registered bidders and the price has been pushed beyond budget.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Premarket inverts this dynamic. Buyers get early access to properties before they&apos;re publicly listed, and their interactions — price opinions, registered interest, saved properties — actively shape the market data that agents and sellers rely on. Buyers become evaluators of value, not just respondents to it.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4">The buyer journey</h3>

            <div className="space-y-6 mb-8">
              <div>
                <h4 className="font-medium text-slate-900 mb-1">1. Browse the showcase</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The buyer visits premarket.homes and explores listings that are off-market, private, or in early campaign phase. These are properties that haven&apos;t surfaced on any public portal — genuine early access.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">2. Discover a property</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The buyer clicks into a property listing, reviews the photos and details, and decides whether it matches what they&apos;re looking for. They can save the property, express interest, or provide a price opinion — all from the property page.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">3. Submit a price opinion</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The buyer enters what they&apos;d genuinely be willing to pay for the property. This isn&apos;t a bid or an offer — it&apos;s a market signal. Each price opinion contributes to the buyer valuation dataset, building a real-time picture of what the market believes a property is worth.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">4. Register strong interest</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  If the buyer is serious, they register their interest. This sends a direct signal to the listing agent: there&apos;s a qualified, motivated buyer. Registered buyers are contacted first when the property progresses — before public competition has a chance to build.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-1">5. Agent engagement</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The listing agent may contact the buyer directly — invite them to a private inspection, discuss their interest, or begin early negotiations. The buyer potentially secures the property before it ever goes public, avoiding the stress and uncertainty of a competitive auction.
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Why buyers choose Premarket</h3>
            <div className="space-y-3 mb-2">
              {[
                ['Early access', 'Properties appear on Premarket weeks before they hit the public portals. Being early changes everything.'],
                ['Reduced competition', 'Fewer buyers means less pressure, more time for due diligence, and better negotiating conditions.'],
                ['Your opinion matters', 'Every price opinion directly feeds the data engine. Buyers aren\'t passive spectators — they\'re the primary source of truth. Their input is what makes price education backed by data possible.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <span className="font-medium text-slate-900">{title}.</span> {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* ════════════════════════════════════════ */}
          {/* PRODUCT                                  */}
          {/* ════════════════════════════════════════ */}

          {/* Core Insight */}
          <section id="core-insight" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">The Core Product Insight</h2>

            <p className="text-slate-600 leading-relaxed mb-6">
              Premarket doesn&apos;t just make existing processes faster or cheaper. It fundamentally restructures who determines value in a real estate transaction.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="rounded-lg border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Traditional model</p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 w-14 flex-shrink-0">Agent</span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="text-sm text-slate-600">guesses the price</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 w-14 flex-shrink-0">Seller</span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="text-sm text-slate-600">hopes it&apos;s right</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 w-14 flex-shrink-0">Buyer</span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="text-sm text-slate-600">reacts to whatever lands</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border-2 border-orange-200 bg-orange-50/30 p-5">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-3">Premarket model</p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 font-medium w-14 flex-shrink-0">Buyer</span>
                    <span className="text-orange-400">&rarr;</span>
                    <span className="text-sm text-slate-700">provides the value signal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 font-medium w-14 flex-shrink-0">Agent</span>
                    <span className="text-orange-400">&rarr;</span>
                    <span className="text-sm text-slate-700">interprets and presents it</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 font-medium w-14 flex-shrink-0">Seller</span>
                    <span className="text-orange-400">&rarr;</span>
                    <span className="text-sm text-slate-700">gains confidence from evidence</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed mb-4">
              The buyer becomes the evaluator of value. Not an algorithm trained on historical sales. Not an agent&apos;s appraisal. Real buyers, expressing what they&apos;d genuinely pay, in real time. This is why Premarket delivers{' '}
              <button onClick={() => scrollTo('price-education')} className="text-orange-600 hover:text-orange-700 underline">
                price education backed by data
              </button>
              {' '}— the data comes from the only source that actually determines value: the buyers themselves.
            </p>
            <p className="text-slate-600 leading-relaxed">
              This is a structural shift. Every interaction on the platform — every price opinion, every interest registration, every saved property — feeds into{' '}
              <button onClick={() => scrollTo('the-data-engine')} className="text-orange-600 hover:text-orange-700 underline">
                the data engine
              </button>
              , generating forward-looking signals about market demand that backward-looking providers like CoreLogic simply cannot capture. The more participants in the system, the more accurate and valuable those signals become.
            </p>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* The Flywheel */}
          <section id="the-flywheel" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">The Flywheel</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Each participant in the Premarket ecosystem creates value for every other participant. This isn&apos;t a linear product — it&apos;s a compounding one.
            </p>

            <ol className="space-y-4 mb-8">
              {[
                ['Agents bring listings', 'Properties enter the system, creating inventory for buyers to discover and evaluate.'],
                ['Buyers give price opinions', 'Real buyer evaluations of property value flow into the data engine — primary data that no other platform captures.'],
                ['Data enables price education', 'Aggregated buyer intent, price opinion distributions, and demand signals form a live valuation layer — replacing backward-looking estimates with forward-looking evidence.'],
                ['Sellers gain confidence', 'Price education backed by buyer data gives sellers the confidence to list. Expectations align with reality because the evidence is undeniable.'],
                ['More listings appear', 'Confident sellers and successful agents bring more properties onto the platform — each one generating more buyer data.'],
                ['Buyers return for early access', 'A growing inventory of pre-market properties attracts more buyers, who provide more price opinions, which makes the data engine more accurate. The accuracy compounds.'],
              ].map(([title, desc], i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      <span className="font-medium text-slate-900">{title}.</span> {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Network effect.</span> Each additional participant — whether agent, buyer, or seller — increases the value of the platform for every other participant. More data means better insights. Better insights mean more confident sellers. More listings mean more buyers. The cycle compounds.
              </p>
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* Integrations */}
          <section id="integrations" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Integrations</h2>
            <p className="text-lg text-slate-500 mb-6">Connecting Premarket directly into the tools agents already use.</p>

            <p className="text-slate-600 leading-relaxed mb-6">
              Most agents live inside their CRM. That&apos;s where their contacts are, where their workflows run, and where their day starts and ends. Premarket is building native integrations with the major real estate CRMs so agents can create campaigns, manage listings, and distribute to their buyer database without ever leaving the tools they already know.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-4">CRM integrations in development</h3>

            <div className="space-y-4 mb-8">
              {[
                ['AgentBox (Reapit)', 'One of Australia\'s most widely used real estate CRMs, used by thousands of agencies across the country.'],
                ['Rex', 'A modern cloud-based CRM built for high-performing real estate teams, popular across Australia and New Zealand.'],
                ['Vault', 'An enterprise-grade CRM used by many of Australia\'s largest agency groups and franchise networks.'],
              ].map(([name, desc], i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-700">In Development</span>
                    <span className="font-medium text-slate-900 text-sm">{name}</span>
                  </div>
                  <p className="text-sm text-slate-600">{desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">What the integrations enable</h3>

            <div className="mb-8">
              <h4 className="font-medium text-slate-900 mb-2">Stage 1 — Campaign management from the CRM</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Agents will be able to create and manage Premarket campaigns directly from within their CRM. Add a property, upload photos, set a price guide, and distribute the campaign link to matched buyers in their database — all without switching platforms. The integration handles syncing property details, contact matching, and campaign distribution through the channels agents already use: SMS, email, and CRM-native workflows.
              </p>

              <h4 className="font-medium text-slate-900 mb-2">Stage 2 — Data flowing back into the CRM</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Once a campaign is live, Premarket will push engagement data back into the CRM. Agents will see report cards and market intelligence directly inside their existing property records — buyer interest levels, price opinion distributions, demand signals, and campaign performance metrics. No need to log into a separate dashboard. The data lives where the agent already works.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Why this matters.</span> CRM integration removes the last friction point in adoption. Agents don&apos;t need to learn a new tool or change their workflow. Premarket becomes a native capability inside the systems they already depend on — which means faster adoption, more campaigns, more data, and a stronger flywheel.
              </p>
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* ════════════════════════════════════════ */}
          {/* MARKET INTELLIGENCE                      */}
          {/* ════════════════════════════════════════ */}

          {/* Data Advantage — hero-style header */}
          <section id="data-advantage" className="scroll-mt-20">
            <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-10 mb-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
              <div className="relative">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Market Intelligence</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  The Data Advantage
                </h2>
                <p className="text-slate-300 leading-relaxed max-w-2xl">
                  Every existing real estate data provider — CoreLogic, Pricefinder, RPData — tells you what already happened. Premarket tells you what&apos;s about to happen.
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Backward-looking vs forward-looking</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              As covered in{' '}
              <button onClick={() => scrollTo('the-data-engine')} className="text-orange-600 hover:text-orange-700 underline">
                The Data Engine
              </button>
              , traditional real estate data is built on historical transactions. A property sold six months ago for $1.2M. A suburb&apos;s median price moved 4% last quarter. These are useful reference points, but they describe a market that no longer exists. By the time the data is published, the conditions that produced it have already changed.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Premarket captures something fundamentally different: <span className="font-medium text-slate-900">forward-looking intent signals</span>. What buyers are actively searching for right now. What they&apos;re willing to pay today. Which properties are generating interest before they&apos;ve hit the market. Where demand is building, shifting, or cooling — in real time. This is the API layer built on top of the same buyer data that powers{' '}
              <button onClick={() => scrollTo('price-education')} className="text-orange-600 hover:text-orange-700 underline">
                price education
              </button>
              {' '}for agents and sellers.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">What the data captures</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Every interaction on Premarket generates a signal. Aggregated across thousands of buyers, properties, and suburbs, these signals form a predictive layer that doesn&apos;t exist anywhere else in real estate.
            </p>

            <div className="space-y-3 mb-8">
              {[
                ['Buyer intent', 'Which locations and property types are attracting active buyer interest — measured by price opinions, saved properties, and registered interest, not just page views.'],
                ['Seller intent', 'Which properties are being tested on the market through pre-market campaigns — a leading indicator of future listings that no portal or data provider can see.'],
                ['Price discovery', 'Real-time price opinion distributions from qualified buyers, creating a crowdsourced valuation layer that updates continuously — not quarterly.'],
                ['Demand trends', 'Buyer activity patterns across time, geography, property type, and price bracket — from country-level trends right down to individual streets.'],
                ['Market forecasting', 'By combining buyer intent with seller intent, Premarket can accurately model which properties are likely to go to market, what buyers are willing to pay for them, and where demand is growing or contracting.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <span className="font-medium text-slate-900">{title}.</span> {desc}
                  </p>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Resolution at every level</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              The Market Intelligence API serves data at every geographic resolution — from macro market trends at the country level, down through state, city, and suburb, all the way to individual streets. This isn&apos;t aggregated portal scraping or extrapolated ABS data. It&apos;s direct behavioural signal from real market participants, captured at the point of intent.
            </p>

            <div className="rounded-lg border border-slate-200 overflow-hidden mb-8">
              <div className="divide-y divide-slate-200">
                {[
                  ['Country', 'National buyer/seller intent trends, market momentum indicators'],
                  ['State', 'State-level demand patterns, cross-state migration signals'],
                  ['City / Region', 'Metro vs regional demand shifts, emerging growth corridors'],
                  ['Suburb', 'Suburb-level buyer scores, seller scores, price opinion medians, trending indicators'],
                  ['Street', 'Hyper-local demand signals, per-property engagement data, micro-market dynamics'],
                ].map(([level, desc], i) => (
                  <div key={i} className="flex items-start gap-4 px-4 py-3">
                    <span className="flex-shrink-0 w-20 text-sm font-medium text-slate-900">{level}</span>
                    <p className="text-sm text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">The compounding advantage.</span> Every new user on the platform — every buyer who submits a price opinion, every agent who creates a campaign — makes the data more accurate, more granular, and more valuable. This is a dataset that improves with scale and cannot be replicated by scraping historical records.
              </p>
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* API Overview */}
          <section id="api-overview" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">API Overview</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              The Market Intelligence API exposes Premarket&apos;s forward-looking data layer through a simple REST interface. Buyer intent scores, seller signals, market forecasts, trending areas, historical trends, and property-level engagement insights — all available programmatically.
            </p>

            <div className="overflow-hidden rounded-lg border border-slate-200 mb-6">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900 bg-slate-50 w-32">Base URL</td>
                    <td className="px-4 py-3">
                      <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
                        https://premarket.homes
                      </code>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900 bg-slate-50">Format</td>
                    <td className="px-4 py-3 text-slate-600">JSON</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900 bg-slate-50">Auth</td>
                    <td className="px-4 py-3 text-slate-600">
                      API key via <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">x-api-key</code> header
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-slate-600 leading-relaxed text-sm">
              All location-based endpoints accept flexible parameters: a freeform{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">location</code>{' '}
              string (e.g. &quot;Bondi Beach, NSW&quot;) which is geocoded automatically, or explicit{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">suburb</code> +{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">state</code>,{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">postcode</code>, or{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">lat</code> +{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">lng</code> +{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">radius</code>{' '}
              (km, default 5).
            </p>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* Authentication */}
          <section id="authentication" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              All API requests require an API key passed via the{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">x-api-key</code>{' '}
              header.
            </p>

            <div className="rounded-lg overflow-hidden border border-slate-800 mb-6">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-medium text-slate-400">Example request header</span>
              </div>
              <pre className="px-4 py-4 text-sm font-mono text-slate-100 bg-slate-900 overflow-x-auto">
{`x-api-key: YOUR_API_KEY`}
              </pre>
            </div>

            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              To get an API key, visit the{' '}
              <Link href="/dashboard/developers" className="text-orange-600 hover:text-orange-700 underline">
                Developer Portal
              </Link>{' '}
              in your dashboard. API keys are scoped to your account and can be revoked at any time.
            </p>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <p className="text-sm font-semibold text-amber-900 mb-1">Keep your key secure</p>
              <p className="text-sm text-amber-800">
                Never expose your API key in client-side code or public repositories. Use environment variables and server-side requests.
              </p>
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* Endpoints */}
          <section id="endpoints" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Endpoints</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Six endpoints covering buyer intent, seller signals, market forecasts, trending suburbs, historical trends, and property-level insights.
            </p>

            <div className="space-y-3">
              {ENDPOINTS.map((ep) => (
                <div
                  key={ep.path}
                  className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-700 font-mono">
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono text-slate-900">{ep.path}</code>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{ep.description}</p>
                  <p className="text-xs text-slate-400">
                    <span className="font-medium text-slate-500">Params:</span> {ep.params}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-200 my-12" />

          {/* Code Examples */}
          <section id="code-examples" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Code Examples</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Quick examples for common languages. Replace{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">YOUR_API_KEY</code>{' '}
              with your actual API key.
            </p>

            {/* cURL */}
            <div className="rounded-lg overflow-hidden border border-slate-800 mb-4">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-medium text-slate-400">cURL</span>
              </div>
              <pre className="px-4 py-4 text-sm font-mono text-slate-100 bg-slate-900 overflow-x-auto">
{`curl -H "x-api-key: YOUR_API_KEY" \\
  "https://premarket.homes/api/v1/buyer-score?location=Bondi+Beach,+NSW"`}
              </pre>
            </div>

            {/* JavaScript */}
            <div className="rounded-lg overflow-hidden border border-slate-800 mb-4">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-medium text-slate-400">JavaScript</span>
              </div>
              <pre className="px-4 py-4 text-sm font-mono text-slate-100 bg-slate-900 overflow-x-auto">
{`const response = await fetch(
  'https://premarket.homes/api/v1/buyer-score?location=Bondi+Beach,+NSW',
  {
    headers: { 'x-api-key': 'YOUR_API_KEY' }
  }
);
const data = await response.json();
console.log(data.score); // 0-100
console.log(data.location.resolvedPlace); // "Bondi Beach, NSW, Australia"`}
              </pre>
            </div>

            {/* Python */}
            <div className="rounded-lg overflow-hidden border border-slate-800 mb-4">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-medium text-slate-400">Python</span>
              </div>
              <pre className="px-4 py-4 text-sm font-mono text-slate-100 bg-slate-900 overflow-x-auto">
{`import requests

response = requests.get(
    'https://premarket.homes/api/v1/buyer-score',
    params={'location': 'Bondi Beach, NSW'},
    headers={'x-api-key': 'YOUR_API_KEY'}
)
data = response.json()
print(f"Buyer Score: {data['score']}")`}
              </pre>
            </div>

            {/* Get API Access CTA */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-slate-600 text-sm mb-4">
                Ready to integrate Premarket market intelligence into your application?
              </p>
              <Link
                href="/dashboard/developers"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Get API Access
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Bottom spacing */}
          <div className="h-24" />
        </div>
      </main>

      {/* ─── Admin Floating Toolbar ─── */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full shadow-lg hover:bg-slate-800 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            Generate Link
          </button>
          <Link
            href="/dashboard/admin/docs-analytics"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 text-sm font-medium rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      )}

      {/* ─── Generate Link Modal ─── */}
      {showLinkModal && (
        <GenerateLinkModal uid={user?.uid} onClose={() => setShowLinkModal(false)} />
      )}
    </div>
  );
}
