'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Heart,
  MapPin,
  Activity,
  Sparkles,
  Scale,
  Settings,
  LogOut,
  ArrowLeftCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isAgent } from '../../utils/roles';

const navItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    href: '/buyer-dashboard',
  },
  {
    id: 'early-access',
    label: 'Early Access',
    icon: Sparkles,
    href: '/buyer-dashboard/early-access',
    accent: true,
  },
  {
    id: 'liked',
    label: 'Liked',
    icon: Heart,
    href: '/buyer-dashboard/liked',
  },
  {
    id: 'compare',
    label: 'Compare',
    icon: Scale,
    href: '/buyer-dashboard/compare',
  },
  {
    id: 'areas',
    label: 'Areas',
    icon: MapPin,
    href: '/buyer-dashboard/areas',
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Activity,
    href: '/buyer-dashboard/insights',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/buyer-dashboard/settings',
  },
];

export default function BuyerSidebar({ onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, signOut } = useAuth();

  const agentMode = isAgent(userData);
  const firstName = userData?.firstName || '';
  const lastName = userData?.lastName || '';
  const email = userData?.email || user?.email || '';
  const avatar = userData?.avatar;
  const hasRealAvatar = avatar && !avatar.includes('placeholder');
  const initials = (firstName[0] || email[0] || '?').toUpperCase();

  const isActive = (href) => {
    if (href === '/buyer-dashboard') return pathname === '/buyer-dashboard';
    return pathname?.startsWith(href);
  };

  const handleSignOut = async () => {
    onNavigate?.();
    await signOut();
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Logo */}
      <div className="px-7 pt-8 pb-7">
        <Link href="/" className="block" onClick={onNavigate}>
          <Image
            src="https://premarketvideos.b-cdn.net/assets/logo.png"
            alt="Premarket"
            width={140}
            height={36}
            className="h-8 w-auto"
            unoptimized
          />
        </Link>
      </div>

      {/* User block */}
      <div className="px-5 pb-5">
        <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-100 p-4">
          <div className="flex items-center gap-3">
            {hasRealAvatar ? (
              <Image
                src={avatar}
                alt="Avatar"
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                unoptimized
              />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-base ring-2 ring-white shadow-sm">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {[firstName, lastName].filter(Boolean).join(' ') || 'Buyer'}
              </p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {agentMode ? 'Agent (buyer view)' : 'Buyer'}
            </span>
            {userData?.buyerProfile?.preApprovalStatus === 'approved' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Pre-approved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const showAccent = item.accent && !active;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all ${
                active
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                  : showAccent
                  ? 'text-orange-700 bg-orange-50/60 hover:bg-orange-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  active
                    ? 'text-white'
                    : showAccent
                    ? 'text-orange-500'
                    : 'text-slate-400'
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-5 border-t border-slate-100 space-y-1">
        {agentMode && (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-orange-600 transition-colors"
          >
            <ArrowLeftCircle className="w-4 h-4" />
            Back to agent view
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
