// components/Nav.js

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';

export default function Nav({ isHomepage = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, userData, loading, signOut } = useAuth();
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const navLinks = [
    { name: 'Browse Properties', href: '/listings' },
  ];

  const initials = user
    ? (userData?.firstName?.[0] || userData?.email?.[0] || '?').toUpperCase()
    : '';

  const avatarUrl = userData?.avatar;
  const hasRealAvatar = avatarUrl && !avatarUrl.includes('placeholder');

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/">
                <Image
                  src="https://premarketvideos.b-cdn.net/assets/logo.png"
                  alt="Premarket Logo"
                  width={140}
                  height={35}
                  className="h-6 sm:h-7 w-auto"
                  unoptimized
                />
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-[#e48900] font-medium text-sm transition-colors duration-200 relative group"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c64500ff] to-[#e48900] group-hover:w-full transition-all duration-300"></span>
                </a>
              ))}

              {!loading && user ? (
                <>
                  {/* Dashboard Link */}
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-[#e48900] font-medium text-sm transition-colors duration-200 relative group"
                  >
                    Dashboard
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c64500ff] to-[#e48900] group-hover:w-full transition-all duration-300"></span>
                  </Link>

                  {/* Avatar Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      {hasRealAvatar ? (
                        <Image
                          src={avatarUrl}
                          alt="Avatar"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {initials}
                        </div>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {[userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || 'Agent'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{userData?.email || user?.email}</p>
                        </div>

                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          Dashboard
                        </Link>

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : !loading ? (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-[#e48900] font-medium text-sm transition-colors duration-200"
                  >
                    Log In
                  </Link>
                  {isHomepage && (
                    <Link
                      href="/join"
                      className="px-5 py-2.5 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200"
                    >
                      Get Started Free
                    </Link>
                  )}
                </>
              ) : null}
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-3 lg:hidden">
              {/* Mobile Avatar (when logged in) */}
              {!loading && user && (
                <Link href="/dashboard" className="flex-shrink-0">
                  {hasRealAvatar ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-[#e48900] to-[#c64500] rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {initials}
                    </div>
                  )}
                </Link>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="px-4 pt-2 pb-6 space-y-1 bg-white border-t border-gray-100">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-[#e48900] font-medium transition-all duration-200"
              >
                {link.name}
              </a>
            ))}

            {!loading && user ? (
              <>
                {/* Logged-in user info */}
                <div className="px-4 py-3 border-t border-gray-100 mt-2 pt-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {[userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || 'Agent'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userData?.email || user?.email}</p>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-[#e48900] font-medium transition-all duration-200"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-[#e48900] font-medium transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  href="/join"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block mx-4 mt-4 px-4 py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold text-center rounded-lg shadow-md"
                >
                  Get Started Free
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
