'use client';

import { useState, useEffect } from 'react';

/**
 * WOW Factor primitives — high-impact components designed to elevate the
 * marketing surface beyond a static brochure. Every piece here is deliberately
 * subtle: motion is short, palettes stay neutral, and brand orange remains the
 * single accent. Together they make the site feel "live, modern, and built by
 * a real product team" without breaking the refined REA-style baseline.
 *
 *   - LiveTicker          Bloomberg-style scrolling market activity bar
 *   - TiltCard            Subtle 3D mouse-tilt wrapper
 *   - HeroFloatingDecor   Floating product cards (health score, opinion bubble, demand)
 *   - GradientMesh        Animated soft gradient backdrop for heroes
 *   - GlowButton          Primary CTA with ambient orange glow
 *   - PulseBadge          "Live" badge with breathing dot
 *   - DigitTicker         Counter that flips digit-by-digit
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, MessageSquare, TrendingUp, Activity, Sparkles } from 'lucide-react';
import BrandMark from '../BrandMark';

// ---------- LiveTicker ----------

const TICKER_DEFAULT = [
  { suburb: 'Bondi',          state: 'New South Wales', score: 87, delta: '+2.4' },
  { suburb: 'Surry Hills',    state: 'New South Wales', score: 82, delta: '+1.1' },
  { suburb: 'Newtown',        state: 'New South Wales', score: 79, delta: '+0.6' },
  { suburb: 'Brunswick',      state: 'Victoria',        score: 84, delta: '+3.2' },
  { suburb: 'Fitzroy',        state: 'Victoria',        score: 81, delta: '+1.8' },
  { suburb: 'South Yarra',    state: 'Victoria',        score: 76, delta: '-0.4' },
  { suburb: 'Paddington',     state: 'Queensland',      score: 88, delta: '+2.9' },
  { suburb: 'New Farm',       state: 'Queensland',      score: 85, delta: '+1.6' },
  { suburb: 'Teneriffe',      state: 'Queensland',      score: 80, delta: '+0.9' },
  { suburb: 'North Adelaide', state: 'South Australia', score: 74, delta: '+0.3' },
  { suburb: 'Cottesloe',      state: 'Western Australia', score: 78, delta: '+1.2' },
  { suburb: 'Battery Point',  state: 'Tasmania',        score: 72, delta: '+0.5' },
];

/**
 * LiveTicker — single horizontal Bloomberg-style strip. Designed to live just
 * below the nav or hero. Pauses on hover. Two duplicated tracks create the
 * seamless infinite loop. Fetches real suburb BDI data from the API on mount.
 */
export function LiveTicker({ items: itemsProp, label = 'Live Market Activity' }) {
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    if (itemsProp) return; // skip fetch if items explicitly provided
    fetch('/api/public/ticker-data')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.items?.length) setFetched(data.items);
      })
      .catch(() => {}); // fall back to defaults silently
  }, [itemsProp]);

  const items = itemsProp || fetched || TICKER_DEFAULT;
  const list = [...items, ...items]; // duplicate for seamless loop
  return (
    <div className="relative w-full bg-slate-950 border-y border-slate-900 overflow-hidden">
      {/* edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10" />

      {/* label badge */}
      <div className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-full pl-2 pr-3 py-1">
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
          <span className="relative rounded-full w-2 h-2 bg-emerald-400" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">{label}</span>
      </div>

      <div className="flex w-max animate-marquee py-3 hover:[animation-play-state:paused]">
        {list.map((it, i) => {
          const positive = it.delta != null && String(it.delta).startsWith('+');
          return (
            <div
              key={`${it.suburb}-${i}`}
              className="flex items-center gap-3 px-6 border-r border-slate-900 last:border-r-0 whitespace-nowrap"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{it.state}</span>
              <span className="text-sm font-semibold text-slate-200">{it.suburb}</span>
              <span className="text-[11px] text-slate-500">Buyer demand</span>
              <span className="text-sm font-mono font-bold text-orange-400">{it.score}</span>
              {it.delta != null && (
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    positive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {it.delta}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
      `}</style>
    </div>
  );
}

// ---------- TiltCard ----------

/**
 * TiltCard — wraps any child with a subtle 3D mouse tilt. Uses motion springs
 * to feel smooth and intentional, never jittery. Disabled on touch devices via
 * pointer-fine media query (the spring just stays at rest).
 */
export function TiltCard({ children, max = 6, className = '' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);

  function handleMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------- GradientMesh ----------

/**
 * GradientMesh — soft, slow-moving orange/peach blobs. Perfect for hero
 * backdrops. Pure CSS, no JS animation loop, GPU-accelerated.
 */
export function GradientMesh({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-orange-200/40 blur-3xl animate-blob" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-amber-200/30 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-rose-100/30 blur-3xl animate-blob animation-delay-4000" />
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(40px, -30px) scale(1.05); }
          66%      { transform: translate(-30px, 40px) scale(0.95); }
        }
        .animate-blob {
          animation: blob 18s ease-in-out infinite;
        }
        .animation-delay-2000 { animation-delay: -6s; }
        .animation-delay-4000 { animation-delay: -12s; }
      `}</style>
    </div>
  );
}

// ---------- HeroFloatingDecor ----------

/**
 * HeroFloatingDecor — three small product mockup cards that float in the
 * margins of a hero. Reads as "this is a real product, here's what it looks
 * like" without committing screen real estate to a full screenshot.
 *
 * Positioned absolutely. Parent must be `relative` and tall enough.
 */
export function HeroFloatingDecor() {
  return (
    <>
      {/* Top-right: PHI score chip */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: 6 }}
        animate={{ opacity: 1, y: 0, rotate: 6 }}
        transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block absolute top-32 right-8 xl:right-16 z-20"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="bg-white rounded-2xl border border-slate-200 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)] p-5 w-[240px]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" strokeWidth={2} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Buyer Demand · Bondi</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+2.4</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold font-mono text-slate-900">87</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '87%' }}
              transition={{ duration: 1.4, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-[#e48900] to-[#c64500]"
            />
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Updated live from real buyers</p>
        </motion.div>
      </motion.div>

      {/* Mid-left: opinion bubble */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 0.9, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block absolute top-[280px] left-4 xl:left-12 z-20"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)] p-4 w-[230px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-[#c64500]" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">New opinion</span>
          </div>
          <p className="text-sm font-bold text-slate-900">$1.42M</p>
          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
            &ldquo;Honest opinion based on the floor plan and recent sales nearby.&rdquo;
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-400">Anonymous · just now</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom-right: trend chip */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ duration: 0.9, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
        className="hidden xl:block absolute bottom-24 right-20 z-20"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] p-4 w-[200px]"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-400" strokeWidth={2.25} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buyer demand</span>
          </div>
          {/* mini sparkline */}
          <svg viewBox="0 0 120 36" className="w-full h-9">
            <defs>
              <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#e48900" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#e48900" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,28 L12,24 L24,26 L36,18 L48,20 L60,12 L72,14 L84,8 L96,10 L108,5 L120,7 L120,36 L0,36 Z" fill="url(#spark)" />
            <path d="M0,28 L12,24 L24,26 L36,18 L48,20 L60,12 L72,14 L84,8 L96,10 L108,5 L120,7" fill="none" stroke="#e48900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-2 text-[11px] text-slate-400">Last 30 days</p>
        </motion.div>
      </motion.div>
    </>
  );
}

// ---------- GlowButton ----------

/**
 * GlowButton — primary CTA with an ambient orange glow that pulses subtly.
 * Use sparingly (one per page max) so it stays special.
 */
export function GlowButton({ href, children, className = '' }) {
  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#e48900] text-white font-semibold text-base hover:bg-[#c64500] transition-all active:scale-[0.98] ${className}`}
    >
      {/* glow */}
      <span className="absolute inset-0 -z-10 rounded-full bg-[#e48900] opacity-50 blur-xl animate-glow-pulse" />
      <Sparkles className="w-4 h-4" strokeWidth={2.25} />
      {children}
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      <style jsx>{`
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%      { opacity: 0.6;  transform: scale(1.05); }
        }
        .animate-glow-pulse {
          animation: glow-pulse 3.5s ease-in-out infinite;
        }
      `}</style>
    </Link>
  );
}

// ---------- PulseBadge ----------

export function PulseBadge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-bold text-emerald-700 uppercase tracking-wider ${className}`}>
      <span className="relative flex w-1.5 h-1.5">
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
        <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </span>
      {children}
    </span>
  );
}

// ---------- DigitTicker ----------

/**
 * DigitTicker — counter with vertically sliding digits. Used for big "live"
 * stats. Fancier than a simple AnimatedCounter when you want a focal moment.
 */
export function DigitTicker({ value, duration = 2400, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start;
    let raf;
    function step(t) {
      if (!start) start = t;
      const elapsed = t - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setN(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  const digits = n.toLocaleString().split('');

  return (
    <span ref={ref} className={`inline-flex font-mono tabular-nums ${className}`}>
      {digits.map((d, i) => (
        <span key={i} className="inline-block">
          {d}
        </span>
      ))}
    </span>
  );
}
