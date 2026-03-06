'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/clientApp';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import {
  LayoutDashboard,
  Home,
  Plus,
  Download,
  LogOut,
  Menu,
  X,
  Eye,
  MessageSquare,
  Heart,
  TrendingUp,
  ChevronRight,
  Bed,
  Bath,
  Car,
  Code,
  Shield,
  Sparkles,
  BookOpen,
  Video,
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

// --- Sidebar ---
function Sidebar({ active, onNavigate, onSignOut, sidebarOpen, setSidebarOpen, userName, userData }) {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'My Properties', icon: Home },
    { id: 'add', label: 'Add Property', icon: Plus, href: '/dashboard/add' },
    { id: 'developers', label: 'Developers', icon: Code, href: '/dashboard/developers' },
    { id: 'docs', label: 'Docs', icon: BookOpen, href: '/docs' },
    ...(userData?.apiAccess?.status === 'approved'
      ? [{ id: 'playground', label: 'Playground', icon: Sparkles, href: '/dashboard/playground' }]
      : []),
    ...(userData?.superAdmin === true
      ? [{ id: 'admin', label: 'Admin', icon: Shield, href: '/dashboard/admin' }]
      : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/">
          <Image
            src="https://premarketvideos.b-cdn.net/assets/logo.png"
            alt="Premarket"
            width={140}
            height={35}
            className="h-7 w-auto"
            unoptimized
          />
        </Link>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-slate-200">
        <p className="text-xs text-slate-500">Welcome back,</p>
        <p className="text-slate-900 font-semibold truncate">{userName}</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        <a
          href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
        >
          <Download className="w-5 h-5" />
          Download App
        </a>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Stat Card ---
function StatCard({ label, value, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 border border-slate-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </motion.div>
  );
}

// --- Property Card ---
function PropertyCard({ property, onToggleVisibility, toggling }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="relative h-48 bg-slate-100">
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
            <Home className="w-12 h-12 text-slate-300" />
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
            property.visibility === true
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {property.visibility === true ? 'Live' : 'Draft'}
          </span>
        </div>
        {/* Video Badge */}
        {(property.videoUrl || property.aiVideo?.url) && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-black/60 text-white">
              <Video className="w-3 h-3" />
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <p className="font-semibold text-slate-900 text-sm truncate mb-1">{property.formattedAddress || property.address || 'No address'}</p>
        <p className="text-lg font-bold text-slate-900 mb-2">{formatPrice(property.price)}</p>

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms}</span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms}</span>
          )}
          {property.carSpaces != null && (
            <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{property.carSpaces}</span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{property.stats?.views || 0} views</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/property/${property.id}`}
            className="flex-1 text-center px-3 py-2 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            View Report
          </Link>
          <button
            onClick={() => onToggleVisibility(property)}
            disabled={toggling}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {property.visibility ? 'Set Draft' : 'Go Live'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Download Banner ---
function DownloadBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('dashboard_banner_dismissed');
    if (!stored) setDismissed(false);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('dashboard_banner_dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-xl border border-slate-200 p-4 mb-6"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Get the Premarket app</p>
            <p className="text-xs text-slate-500">Manage your properties on the go</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] opacity-80 leading-tight">Download on the</div>
              <div className="text-xs font-semibold leading-tight">App Store</div>
            </div>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] opacity-80 leading-tight">Get it on</div>
              <div className="text-xs font-semibold leading-tight">Google Play</div>
            </div>
          </a>
          <button onClick={dismiss} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600 ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Empty State ---
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
    >
      <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Home className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No properties yet</h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">
        Add your first property to start collecting buyer opinions and market insights.
      </p>
      <Link
        href="/dashboard/add"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
      >
        <Plus className="w-5 h-5" />
        Add Your First Property
      </Link>
    </motion.div>
  );
}

// --- Main Dashboard ---
export default function DashboardPage() {
  const { user, userData, loading, signOut } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [opinionsCount, setOpinionsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/join');
    }
  }, [user, loading, router]);

  // Fetch properties
  useEffect(() => {
    if (!user) return;
    const fetchProperties = async () => {
      setPropertiesLoading(true);
      try {
        const q = query(collection(db, 'properties'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const props = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setProperties(props);

        // Fetch buyer opinions count
        const propertyIds = props.map(p => p.id);
        if (propertyIds.length > 0) {
          let totalOpinions = 0;
          // Firestore 'in' queries limited to 30 items per batch
          for (let i = 0; i < propertyIds.length; i += 30) {
            const batch = propertyIds.slice(i, i + 30);
            const offersSnap = await getDocs(
              query(collection(db, 'offers'), where('propertyId', 'in', batch))
            );
            totalOpinions += offersSnap.docs.filter(d => d.data().type === 'opinion').length;
          }
          setOpinionsCount(totalOpinions);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setPropertiesLoading(false);
      }
    };
    fetchProperties();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/join');
  };

  const toggleVisibility = async (property) => {
    setToggling(true);
    try {
      const newVisibility = !property.visibility;
      await updateDoc(doc(db, 'properties', property.id), { visibility: newVisibility });
      setProperties(prev =>
        prev.map(p => p.id === property.id ? { ...p, visibility: newVisibility } : p)
      );
    } catch (err) {
      console.error('Error toggling visibility:', err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (!user) return null;

  const userName = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || 'Agent';
  const liveProperties = properties.filter(p => p.visibility === true);
  const totalViews = properties.reduce((sum, p) => sum + (p.stats?.views || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        active={activeTab}
        onNavigate={setActiveTab}
        onSignOut={handleSignOut}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userName={userName}
        userData={userData}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <span className="text-lg font-bold text-slate-900">Dashboard</span>
            <Link href="/dashboard/add" className="p-2 hover:bg-slate-100 rounded-lg">
              <Plus className="w-5 h-5 text-slate-700" />
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <DownloadBanner />

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {activeTab === 'overview' ? 'Dashboard' : 'My Properties'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {activeTab === 'overview'
                  ? `Welcome back, ${userData?.firstName || 'Agent'}`
                  : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
              </p>
            </div>
            <Link
              href="/dashboard/add"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </Link>
          </div>

          {/* Overview Stats */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Properties" value={propertiesLoading ? '...' : properties.length} icon={Home} />
              <StatCard label="Live Campaigns" value={propertiesLoading ? '...' : liveProperties.length} icon={TrendingUp} />
              <StatCard label="Total Views" value={propertiesLoading ? '...' : totalViews} icon={Eye} />
              <StatCard label="Buyer Opinions" value={propertiesLoading ? '...' : opinionsCount} icon={MessageSquare} />
            </div>
          )}

          {/* Quick Actions (overview only) */}
          {activeTab === 'overview' && !propertiesLoading && properties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/dashboard/add"
                className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Plus className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Add Property</p>
                  <p className="text-xs text-slate-500">List a new property for your client</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </Link>
              <button
                onClick={() => setActiveTab('properties')}
                className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow group text-left"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Eye className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">View Reports</p>
                  <p className="text-xs text-slate-500">See buyer opinions and insights</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          )}

          {/* Properties Grid */}
          {propertiesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
            </div>
          ) : properties.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onToggleVisibility={toggleVisibility}
                  toggling={toggling}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
