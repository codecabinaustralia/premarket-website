'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { isAgent } from '../utils/roles';
import { authFetch } from '../utils/authFetch';
import BuyerSidebar from './components/BuyerSidebar';

export default function BuyerDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userData, loading, setUserData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [silentAgentBootstrapDone, setSilentAgentBootstrapDone] = useState(false);

  const isWelcome = pathname === '/buyer-dashboard/welcome';

  // Auth gate
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
  }, [loading, user, router]);

  // Wizard gate (for buyers without a completed profile)
  useEffect(() => {
    if (loading || !user || !userData) return;
    if (isWelcome) return; // never redirect away from the wizard itself
    if (isAgent(userData)) return; // agents bypass the wizard entirely
    if (!userData.buyerProfile?.onboardingComplete) {
      router.replace('/buyer-dashboard/welcome');
    }
  }, [loading, user, userData, router, isWelcome]);

  // Agent escape hatch: silently mark onboarding complete so the layout gate above passes.
  useEffect(() => {
    if (loading || !user || !userData) return;
    if (silentAgentBootstrapDone) return;
    if (!isAgent(userData)) return;
    if (userData.buyerProfile) return;
    (async () => {
      try {
        const res = await authFetch('/api/buyer/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            onboardingComplete: true,
            skipped: true,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setUserData?.({
            ...userData,
            buyerProfile: data.buyerProfile,
          });
        }
      } catch (err) {
        console.error('Silent buyer profile bootstrap failed:', err);
      } finally {
        setSilentAgentBootstrapDone(true);
      }
    })();
  }, [loading, user, userData, silentAgentBootstrapDone, setUserData]);

  // The wizard has its own full-screen layout via welcome/layout.js
  if (isWelcome) return children;

  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/70 z-30">
        <BuyerSidebar />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-base font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
          Premarket
        </span>
        <div className="w-9" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
              <BuyerSidebar onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="lg:pl-72">
        <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
