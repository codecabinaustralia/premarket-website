'use client';

/**
 * Bottom-left animated toasts that simulate live buyer activity across the
 * Premarket platform. Shown on marketing pages to convey "live data" feel.
 *
 * Pure cosmetic — no real data fetched. Cycles through a curated pool of
 * realistic Australian suburbs, price ranges, and event types.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Heart, Eye, MessageSquare, Sparkles } from 'lucide-react';

const SUBURBS = [
  ['Bondi', 'NSW'],
  ['Brighton', 'VIC'],
  ['Newtown', 'NSW'],
  ['South Yarra', 'VIC'],
  ['New Farm', 'QLD'],
  ['Cottesloe', 'WA'],
  ['North Adelaide', 'SA'],
  ['Manly', 'NSW'],
  ['Fitzroy', 'VIC'],
  ['Paddington', 'NSW'],
  ['Toorak', 'VIC'],
  ['Hawthorn', 'VIC'],
  ['Mosman', 'NSW'],
  ['St Kilda', 'VIC'],
  ['Bulimba', 'QLD'],
  ['Subiaco', 'WA'],
  ['Hamilton', 'QLD'],
  ['Surry Hills', 'NSW'],
  ['Carlton', 'VIC'],
  ['Glebe', 'NSW'],
];

const FIRST_NAMES = [
  'Sarah', 'James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Mia', 'Henry',
  'Sophie', 'Oliver', 'Charlotte', 'Lucas', 'Ava', 'Ethan', 'Isla',
  'Hugo', 'Grace', 'Max', 'Ruby', 'Leo',
];

const STREETS = [
  'Ocean Ave', 'Hill St', 'Park Rd', 'Beach Rd', 'High St',
  'Church St', 'Station St', 'Queen St', 'King St', 'Bay St',
  'Marine Pde', 'Victoria Rd', 'Albert St', 'George St', 'Macquarie St',
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randPrice() {
  // Round to nearest 25k between $650k and $4.5m
  const buckets = [
    650, 720, 780, 850, 925, 980, 1050, 1150, 1240, 1340, 1450,
    1580, 1680, 1820, 1950, 2150, 2380, 2580, 2750, 2950, 3200,
    3450, 3680, 3950, 4250, 4500,
  ];
  return rand(buckets) * 1000;
}

function fmtPrice(n) {
  if (n >= 1_000_000) {
    const m = (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2);
    return `$${m}M`;
  }
  return `$${Math.round(n / 1000)}k`;
}

function makeEvent() {
  const [suburb, state] = rand(SUBURBS);
  const name = rand(FIRST_NAMES);
  const streetNo = Math.floor(Math.random() * 220) + 1;
  const street = rand(STREETS);
  const address = `${streetNo} ${street}, ${suburb}`;
  const types = ['opinion', 'opinion', 'opinion', 'interest', 'view', 'opinion', 'match'];
  const type = rand(types);
  const price = randPrice();

  switch (type) {
    case 'opinion':
      return {
        id: Math.random().toString(36).slice(2),
        type,
        title: `${name} priced a property`,
        body: `${address} · ${fmtPrice(price)}`,
        accent: '#e48900',
        icon: TrendingUp,
        meta: state,
      };
    case 'interest':
      return {
        id: Math.random().toString(36).slice(2),
        type,
        title: `${name} registered interest`,
        body: `${address}`,
        accent: '#10b981',
        icon: Heart,
        meta: state,
      };
    case 'view':
      return {
        id: Math.random().toString(36).slice(2),
        type,
        title: `New buyer viewed`,
        body: `${address}`,
        accent: '#3b82f6',
        icon: Eye,
        meta: state,
      };
    case 'match':
    default:
      return {
        id: Math.random().toString(36).slice(2),
        type,
        title: `Matched 4 buyers`,
        body: `${suburb} ${state} · 3 bed house`,
        accent: '#8b5cf6',
        icon: Sparkles,
        meta: state,
      };
  }
}

export default function PriceOpinionToasts({
  visibleMs = 3800,
  gapMs = 700,
  startDelayMs = 1800,
}) {
  const [event, setEvent] = useState(null);
  const [enabled, setEnabled] = useState(false);

  // Respect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    const t = setTimeout(() => setEnabled(true), startDelayMs);
    return () => clearTimeout(t);
  }, [startDelayMs]);

  // Cycle one event at a time: show → hide → wait → show next
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timeoutId;

    function showNext() {
      if (cancelled) return;
      setEvent(makeEvent());
      timeoutId = setTimeout(hide, visibleMs);
    }

    function hide() {
      if (cancelled) return;
      setEvent(null);
      timeoutId = setTimeout(showNext, gapMs);
    }

    showNext();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled, visibleMs, gapMs]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-4 left-4 z-40 max-w-[calc(100vw-2rem)] sm:max-w-xs"
    >
      <AnimatePresence mode="wait">
        {event && (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -40, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="pointer-events-auto"
          >
            <div className="flex items-start gap-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-900/[0.08] px-3.5 py-3 pr-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${event.accent}22, ${event.accent}0d)`,
                }}
              >
                {(() => {
                  const Icon = event.icon;
                  return <Icon className="w-4 h-4" style={{ color: event.accent }} strokeWidth={2.4} />;
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-900 leading-tight truncate">
                  {event.title}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{event.body}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Live · {event.meta}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
