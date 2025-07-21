'use client';

import Link from 'next/link';
import { useState } from 'react';
import Countdown from './Countdown';
import { ChevronRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../context/ModalContext';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setShowModal } = useModal();

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
            <div
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="hover:text-gray-500">Products</button>

              {/* Dropdown */}
              <div
                className={`absolute top-full left-0 bg-white rounded-lg shadow-xl p-4 z-50 transition-all duration-200 ${isDropdownOpen
                  ? 'opacity-100 scale-100 visible'
                  : 'opacity-0 scale-95 invisible pointer-events-none'
                  }`}
              >
                <div className="mt-6 flex flex-col space-y-2 text-xs w-96">
                  {[
                    {
                      img: '/assets/icon1.png',
                      link: '/',
                      title: 'Test The Market Campaign',
                      desc: 'Run a 30 day campaign to test the market and gauge interest in your property.'
                    },
                    {
                      img: '/assets/icon3.png',
                      link: '/agents',
                      title: 'Go To Market Agents',
                      desc: 'Work with agents in a structured 30 day campaign before formally listing.'
                    },
                    {
                      img: '/assets/icon2.png',
                      link: '/edge',
                      title: 'Premarket Edge - Sell Yourself',
                      desc: 'Skip agents. Engage directly with buyers and save.'
                    }
                  ].map(({ img, title, desc, link }) => (
                     <Link href={link} key={'link' + link}>
                    <div className="flex space-x-2 items-center" key={title}>
                     
                      <img src={img} className="w-10 rounded -mt-10 mr-2 h-auto" />
                      <div className="pr-6">
                        <div className="hover:text-gray-500 font-bold text-gray-900 text-lg">
                          {title}
                        </div>
                        <div className="text-gray-500 font-normal inter text-xs mb-6">{desc}</div>
                      </div>
                      <ChevronRight className="text-gray-500" />
                      
                    </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="#" className="hover:text-gray-500">Pricing</Link>
            <Link href="#" className="hover:text-gray-500">Why Us</Link>
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
          <button onClick={() => setShowModal(true)} className="text-xs font-bold bg-blue-800 text-white px-3 py-3 rounded-lg hover:bg-blue-900 transition">
            Launch your free campaign
          </button>
          <button className="text-xs font-bold bg-white text-gray-900 px-3 py-3 rounded-lg hover:bg-gray-100 border border-gray-900 transition">
            Buyers
          </button>
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
                <div className="mb-2 text-gray-500 uppercase text-xs">Products</div>
                <div className="space-y-4">
                  <Link href="/" className="block">Test The Market Campaign</Link>
                  <Link href="/agents" className="block">Go To Market Agents</Link>
                  <Link href="/edge" className="block">Premarket Edge</Link>
                </div>
              </div>

              <Link href="#" className="block">Pricing</Link>
              <Link href="#" className="block">Why Us</Link>
              <hr />
              <div className="space-y-2 pt-2">
                <button className="w-full text-left bg-blue-800 text-white px-4 py-3 rounded-lg">Launch your free campaign</button>
                <button className="w-full text-left bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-900">Buyers</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
