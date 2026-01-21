'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Animated mouse cursor component
function AnimatedCursor({ x, y, clicking }) {
  return (
    <motion.div
      className="absolute z-50 pointer-events-none"
      animate={{ x, y }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        animate={{ scale: clicking ? 0.8 : 1 }}
        transition={{ duration: 0.1 }}
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"
          fill="#1e293b"
          stroke="white"
          strokeWidth="1.5"
        />
      </motion.svg>
      {clicking && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute top-0 left-0 w-4 h-4 bg-orange-400/30 rounded-full -translate-x-1 -translate-y-1"
        />
      )}
    </motion.div>
  );
}

// Combined animated demo component
function AnimatedDemo() {
  const [phase, setPhase] = useState(0);
  const [priceValue, setPriceValue] = useState(650000);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 100 });
  const [clicking, setClicking] = useState(false);
  const [showLead, setShowLead] = useState(false);

  // Animation sequence
  useEffect(() => {
    const sequence = [
      // Phase 0: Cursor moves to slider
      () => {
        setCursorPos({ x: 80, y: 195 });
        setTimeout(() => setPhase(1), 800);
      },
      // Phase 1: Drag slider right
      () => {
        setClicking(true);
        setTimeout(() => {
          setPriceValue(720000);
          setCursorPos({ x: 140, y: 195 });
        }, 200);
        setTimeout(() => {
          setPriceValue(785000);
          setCursorPos({ x: 200, y: 195 });
        }, 600);
        setTimeout(() => {
          setClicking(false);
          setPhase(2);
        }, 1000);
      },
      // Phase 2: Move to Register Interest button
      () => {
        setCursorPos({ x: 150, y: 310 });
        setTimeout(() => setPhase(3), 800);
      },
      // Phase 3: Click Register Interest
      () => {
        setClicking(true);
        setTimeout(() => {
          setClicking(false);
          setShowLead(true);
          setPhase(4);
        }, 300);
      },
      // Phase 4: Show lead card sliding in
      () => {
        setTimeout(() => setPhase(5), 2500);
      },
      // Phase 5: Reset and loop
      () => {
        setShowLead(false);
        setPriceValue(650000);
        setCursorPos({ x: 50, y: 100 });
        setTimeout(() => setPhase(0), 1000);
      },
    ];

    const timeout = setTimeout(() => {
      sequence[phase]();
    }, phase === 0 ? 1500 : 100);

    return () => clearTimeout(timeout);
  }, [phase]);

  return (
    <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Animated cursor */}
      <AnimatedCursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Price Opinion Section */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">What would you pay?</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Anonymous</span>
          </div>

          <div className="mb-6">
            <motion.div
              className="text-3xl font-bold text-slate-900 mb-2"
              key={priceValue}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              ${priceValue.toLocaleString()}
            </motion.div>

            {/* Price slider track */}
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#e48900] to-[#c64500] rounded-full"
                animate={{ width: `${((priceValue - 600000) / 300000) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
              {/* Animated price indicator */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-orange-500 rounded-full shadow-lg"
                animate={{
                  left: `calc(${((priceValue - 600000) / 300000) * 100}% - 10px)`,
                  scale: clicking && phase === 1 ? 1.2 : 1
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>$600k</span>
              <span>$900k</span>
            </div>
          </div>

          <motion.button
            animate={{
              scale: clicking && phase === 3 ? 0.95 : 1,
              boxShadow: clicking && phase === 3 ? "0 0 0 4px rgba(228, 137, 0, 0.3)" : "none"
            }}
            className="w-full py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold rounded-lg"
          >
            Register Interest
          </motion.button>

          <p className="text-xs text-slate-500 mt-3 text-center">
            Your opinion helps the vendor understand market sentiment
          </p>
        </div>

        {/* Lead Card Section */}
        <div className="p-6 relative min-h-[280px]">
          <AnimatePresence>
            {!showLead ? (
              <motion.div
                key="placeholder"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse"></div>
                <div className="h-10 bg-slate-50 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                <div className="h-10 bg-slate-50 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse"></div>
              </motion.div>
            ) : (
              <motion.div
                key="leadCard"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-4 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-white font-bold text-xs">
                      JS
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">James Sullivan</div>
                      <div className="text-xs text-slate-500">0412 ••• •••</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-3 h-3 ${star <= 4 ? 'text-orange-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Finance Approved
                  </span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    Keen
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Budget:</span>
                    <span className="font-medium text-slate-900">$750k - $850k</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Timeline:</span>
                    <span className="font-medium text-slate-900">Ready now</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Caption at bottom */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-orange-50/30 border-t border-slate-100">
        <p className="text-sm text-slate-600 text-center">
          <span className="font-medium text-slate-900">Buyers leave price opinions</span> on homes they like and{' '}
          <span className="font-medium text-slate-900">register their interest</span> on homes they love.
        </p>
      </div>
    </div>
  );
}

export default function AgentSolution() {
  const steps = [
    { number: '1', text: 'Add a property in seconds' },
    { number: '2', text: 'Share it privately with real buyers' },
    { number: '3', text: 'Collect price opinions & interest' },
    { number: '4', text: 'Walk back into the conversation with data' }
  ];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            <span className="block">Premarket Is the System Your</span>
            <span className="bg-gradient-to-r from-violet-700 to-violet-900 bg-clip-text text-transparent">
              Pre-Market Conversations
            </span>{' '}
            <span className="block sm:inline">Have Been Missing</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            A simple, powerful platform that replaces guesswork with real data
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e48900] to-[#c64500] flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-orange-500/30">
                  {step.number}
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {step.text}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-orange-300 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Animated Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <AnimatedDemo />
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-slate-600 mb-6">
            This isn&apos;t theoretical. This is what your vendors see when buyers engage with their property.
          </p>
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
      </div>
    </section>
  );
}
