'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';

// Floating animation variants
const floatAnimation = {
  y: [0, -15, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const floatAnimationDelayed = {
  y: [0, -12, 0],
  transition: {
    duration: 3.5,
    repeat: Infinity,
    ease: "easeInOut",
    delay: 0.5
  }
};

const floatAnimationSlow = {
  y: [0, -10, 0],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: "easeInOut",
    delay: 1
  }
};

// Animated price indicator component
function AnimatedPriceIndicator() {
  const [price, setPrice] = useState(785000);
  const [direction, setDirection] = useState('up');

  useEffect(() => {
    const interval = setInterval(() => {
      setPrice(prev => {
        const change = Math.floor(Math.random() * 15000) + 5000;
        const newDirection = Math.random() > 0.4 ? 'up' : 'down';
        setDirection(newDirection);

        if (newDirection === 'up') {
          return Math.min(prev + change, 850000);
        } else {
          return Math.max(prev - change, 720000);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300 ${
        direction === 'up'
          ? 'bg-gradient-to-br from-green-500 to-green-600'
          : 'bg-gradient-to-br from-orange-500 to-orange-600'
      }`}>
        <motion.svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: direction === 'up' ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </motion.svg>
      </div>
      <div>
        <motion.div
          key={price}
          initial={{ scale: 1.1, color: direction === 'up' ? '#16a34a' : '#ea580c' }}
          animate={{ scale: 1, color: '#0f172a' }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold"
        >
          ${price.toLocaleString()}
        </motion.div>
        <div className="text-xs text-slate-500">Avg. Price Opinion</div>
      </div>
    </div>
  );
}

export default function AgentHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6"
            >
              <span className="">If You&apos;re Asking for Marketing Money Upfront, </span>
              <span className="bg-gradient-to-r from-[#e48900] to-[#c64500] bg-clip-text text-transparent">
                You&apos;re Doing It Wrong.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Premarket gives you unlimited premarket campaigns to offer vendors on day one.
              Gather real buyer feedback, build trust fast, and walk into your next conversation
              with <span className="font-semibold text-slate-900">proof — not promises</span>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.a
                href="https://calendly.com/knockknock-premarket/30min"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#e48900] to-[#c64500] rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
              >
                Book a Demo
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Right Column - Visual Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Floating cards preview */}
            <div className="relative h-[500px] lg:h-[600px]">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-orange-500/20 blur-3xl rounded-full" />

              {/* Main card - Property preview with floating animation */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
              >
                <motion.div
                  animate={floatAnimation}
                  className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-200"
                >
                  <div className="aspect-video bg-slate-100 rounded-lg mb-4 overflow-hidden relative">
                    <Image
                      src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
                      alt="Modern home exterior"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="font-semibold text-slate-900">42 Harbour View Drive</div>
                    <div className="text-sm text-slate-500">Mosman, NSW 2088</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full font-medium">Pre-Market</span>
                    <span className="text-slate-500">12 buyers interested</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating stat card - top right with floating animation */}
              <motion.div
                initial={{ opacity: 0, x: 40, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute top-8 right-0 lg:right-8"
              >
                <motion.div
                  animate={floatAnimationDelayed}
                  className="bg-white rounded-xl shadow-xl p-4 border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">18</div>
                      <div className="text-xs text-slate-500">Price Opinions</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating price indicator - bottom left with floating animation */}
              <motion.div
                initial={{ opacity: 0, x: -40, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute bottom-8 left-0 lg:left-8"
              >
                <motion.div
                  animate={floatAnimationSlow}
                  className="bg-white rounded-xl shadow-xl p-4 border border-slate-200"
                >
                  <AnimatedPriceIndicator />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-slate-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
