'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function AgentAIImageEditing() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'Clear the Clutter',
      description: 'remove the clutter in this room and clean the roof from mould. Open the window curtains and make lighting more professional.',
      beforeImage: 'https://premarketvideos.b-cdn.net/assets/clutter1.jpg',
      afterImage: 'https://premarketvideos.b-cdn.net/assets/clutter2.png',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    },
    {
      title: 'Day to Dusk',
      description: 'Keep everything the same just change to dusk time.',
      beforeImage: 'https://premarketvideos.b-cdn.net/assets/day1.jpg',
      afterImage: 'https://premarketvideos.b-cdn.net/assets/day2.png',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    },
    {
      title: 'Perfect the Lawn',
      description: 'Clean up the lawn but keep the garden the same.',
      beforeImage: 'https://premarketvideos.b-cdn.net/assets/lawn1.jpg',
      afterImage: 'https://premarketvideos.b-cdn.net/assets/lawn2.png',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      title: 'Sky Replacement',
      description: 'Change the sky to sun set',
      beforeImage: 'https://premarketvideos.b-cdn.net/assets/sky1.jpg',
      afterImage: 'https://premarketvideos.b-cdn.net/assets/sky2.png',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      )
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-orange-500/20 rounded-full mb-6 border border-violet-500/30">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-violet-300 text-sm font-medium">AI-Powered Image Enhancement</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="block">Phone Photos.</span>
            <span className="bg-gradient-to-r from-[#e48900] to-[#c64500] bg-clip-text text-transparent">
              Professional Results.
            </span>
          </h2>

          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Pre-market happens before the professional photographer shows up.
            That doesn&apos;t mean you have to sacrifice quality.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          {/* Left: Feature Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                onClick={() => setActiveFeature(index)}
                className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                  activeFeature === index
                    ? 'bg-gradient-to-r from-[#e48900]/20 to-[#c64500]/20 border border-orange-500/40'
                    : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    activeFeature === index
                      ? 'bg-gradient-to-br from-[#e48900] to-[#c64500] text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                      activeFeature === index ? 'text-white' : 'text-slate-300'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm ${
                      activeFeature === index ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                  {activeFeature === index && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Visual Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-800 border border-slate-700">
              {/* Before/After Images */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex"
                >
                  {/* Before side */}
                  <div className="w-1/2 relative overflow-hidden">
                    <img
                      src={features[activeFeature].beforeImage}
                      alt={`${features[activeFeature].title} - Before`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm rounded-lg text-xs text-slate-300 font-medium">
                      Before
                    </div>
                  </div>

                  {/* After side */}
                  <div className="w-1/2 relative overflow-hidden">
                    <img
                      src={features[activeFeature].afterImage}
                      alt={`${features[activeFeature].title} - After`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-[#e48900] to-[#c64500] rounded-lg text-xs text-white font-medium">
                      After
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Center Divider */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-400 -translate-x-1/2 z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>

              {/* Feature Label */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`label-${activeFeature}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#e48900] to-[#c64500] text-white shrink-0">
                      {features[activeFeature].icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold">{features[activeFeature].title}</p>
                      <p className="text-slate-400 text-sm truncate">{features[activeFeature].description}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-2xl" />
          </motion.div>
        </div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/50 rounded-3xl p-8 md:p-12 border border-slate-700/50 backdrop-blur-sm">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="text-center md:text-left">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e48900] to-[#c64500] flex items-center justify-center text-white text-xl font-bold mx-auto md:mx-0 mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">First Meeting</h3>
                <p className="text-slate-400">
                  Snap photos straight from your phone during the appraisal. No professional photographer needed yet.
                </p>
              </div>

              {/* Arrow (hidden on mobile) */}
              <div className="hidden md:flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Mobile arrow */}
              <div className="flex md:hidden justify-center">
                <svg className="w-8 h-8 text-orange-500 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Step 2 */}
              <div className="text-center md:text-left">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e48900] to-[#c64500] flex items-center justify-center text-white text-xl font-bold mx-auto md:mx-0 mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Enhancement</h3>
                <p className="text-slate-400">
                  Our state-of-the-art AI transforms amateur photos into professional-quality images instantly.
                </p>
              </div>

              {/* Arrow (hidden on mobile) */}
              <div className="hidden md:flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Mobile arrow */}
              <div className="flex md:hidden justify-center">
                <svg className="w-8 h-8 text-orange-500 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Step 3 */}
              <div className="text-center md:text-left">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e48900] to-[#c64500] flex items-center justify-center text-white text-xl font-bold mx-auto md:mx-0 mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Back at the Office</h3>
                <p className="text-slate-400">
                  Full professional listing ready. Maybe even buyer interest already. That&apos;s speed. That&apos;s value.
                </p>
              </div>
            </div>

            {/* Bottom Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 pt-8 border-t border-slate-700/50 text-center"
            >
              <p className="text-2xl md:text-3xl font-bold text-white mb-2">
                That&apos;s value. That&apos;s{' '}
                <span className="bg-gradient-to-r from-[#e48900] to-[#c64500] bg-clip-text text-transparent">
                  Premarket.
                </span>
              </p>
              <p className="text-slate-400">
                From first meeting to live listing, faster than ever before.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
