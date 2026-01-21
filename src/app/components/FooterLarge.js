// components/Footer.js

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src="https://premarket.homes/assets/logo.png"
              alt="Premarket Logo"
              width={140}
              height={35}
              className="mb-4 brightness-0 invert"
              unoptimized
            />
            <p className="text-slate-400 text-sm max-w-xs">
              Discover exclusive pre-market properties before they hit the market.
            </p>
          </div>

          {/* Company Links */}
          <div>
            {/* <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
            </ul> */}

            <h3 className="font-bold mb-4">Solutions</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home Owner
                </a>
              </li>
              <li>
                <a href="/buyers" className="hover:text-white transition-colors">
                  Buyer / Investor
                </a>
              </li>
              <li>
                <a href="/agents" className="hover:text-white transition-colors">
                  Agents
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Stay Connected */}
          <div>
            <h3 className="font-bold mb-4">Stay Connected</h3>
            <p className="text-slate-400 text-sm mb-4">
              Get early access to exclusive pre-market properties.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse Properties
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Premarket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}