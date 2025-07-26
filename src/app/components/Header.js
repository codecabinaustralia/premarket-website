'use client';

import Link from 'next/link';
import { useState } from 'react';
import Countdown from './Countdown';
import { ChevronRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../context/ModalContext';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setShowModal } = useModal();

  const pathname = usePathname();

  const linkClass = (href) =>
    `hover:text-gray-500 px-2 py-3 transition-all ${
      pathname === href ? 'border-b-2 border-red-700 text-red-700' : ''
    }`;


  return (
    <header className="bg-white shadow pt-20 sm:pt-14 relative z-50">
      {/* Countdown fixed at top */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Countdown />
      </div>

      {/* Header content */}
      <div className="container mx-auto px-4 py-4 flex justify-between items-center relative z-40">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <Link href="/">
          <img src="./iconFull.png" className="w-10 h-10 rounded-lg" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex ml-6 space-x-6 text-gray-900 font-bold text-xs tracking-tight items-center relative">
           
            
            <Link href="/" className={linkClass('/')}>Our Campaigns</Link>
      <Link href="/edge" className={linkClass('/edge')}>Premarket Edge</Link>
      <Link href="/agents" className={linkClass('/agents')}>Go To Market</Link>
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex space-x-2">
          <button onClick={() => setShowModal(true)} className="text-xs cursor-pointer font-bold bg-blue-800 text-white px-3 py-3 rounded-lg hover:bg-blue-900 transition">
            Launch your free campaign
          </button>
          {/* <button className="text-xs cursor-pointer font-bold bg-white text-gray-900 px-3 py-3 rounded-lg hover:bg-gray-100 border border-gray-900 transition">
            Buyers
          </button> */}
        </div>
      </div>

      {/* Mobile Side Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 w-3/4 h-full bg-white shadow-lg z-[100] p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <img src="./iconFull.png" className="w-10 h-10 rounded-lg" />
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-6 h-6 text-gray-800" />
              </button>
            </div>

            <div className="space-y-6 text-sm font-bold text-gray-900">
              <div>
                <div className="space-y-4">
                  <Link href="/" className="block">Test The Market Campaign</Link>
                  <Link href="/agents" className="block">Go To Market Agents</Link>
                  <Link href="/edge" className="block">Premarket Edge</Link>
                </div>
              </div>

              {/* <Link href="#" className="block">Pricing</Link>
              <Link href="#" className="block">Why Us</Link> */}
              <hr />
              <div className="space-y-2 pt-2">
                <button onClick={() => setShowModal(true)}  className="w-full text-left bg-blue-800 text-white px-4 py-3 rounded-lg">Launch your free campaign</button>
                {/* <button className="w-full text-left bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-900">Buyers</button> */}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
