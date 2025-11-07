// components/Nav.js

'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'For Home Owners', href: '/' },
    { name: 'For Buyers/Investors', href: '/buyers' },
    { name: 'For Agents', href: '#agents' },
    { name: 'How it Works', href: '#how-it-works' },
  ];

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/">
                <Image
                  src="https://premarket.homes/assets/logo.png"
                  alt="Premarket Logo"
                  width={140}
                  height={35}
                  className="h-6 sm:h-7 w-auto"
                  unoptimized
                />
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
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
            </nav>

            {/* Desktop Store Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <a
                href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <Image
                  src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                  alt="Download on the App Store"
                  width={120}
                  height={40}
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <Image
                  src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
                  alt="Get it on Google Play"
                  width={120}
                  height={40}
                />
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
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

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="px-4 pt-2 pb-6 space-y-1 bg-white border-t border-gray-100">
            {/* Mobile Navigation Links */}
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

            {/* Mobile Store Buttons */}
            <div className="pt-4 space-y-3">
              <a
                href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Image
                  src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                  alt="Download on the App Store"
                  width={140}
                  height={46}
                  className="mx-auto"
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Image
                  src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
                  alt="Get it on Google Play"
                  width={140}
                  height={46}
                  className="mx-auto"
                />
              </a>
            </div>
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