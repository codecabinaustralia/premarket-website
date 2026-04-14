'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';
import { useBuyerData } from '../hooks/useBuyerData';

function formatDate(ts) {
  if (!ts) return '—';
  const ms = ts.toMillis?.() ?? ts._seconds * 1000 ?? null;
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(n) {
  if (n == null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
  return `$${num.toLocaleString()}`;
}

const SERIOUSNESS_LABELS = {
  just_browsing: 'Just browsing',
  interested: 'Interested',
  very_interested: 'Very interested',
  ready_to_buy: 'Ready to buy',
};

const SERIOUSNESS_TONE = {
  just_browsing: 'bg-slate-100 text-slate-600',
  interested: 'bg-blue-100 text-blue-700',
  very_interested: 'bg-amber-100 text-amber-700',
  ready_to_buy: 'bg-emerald-100 text-emerald-700',
};

export default function OpinionsPage() {
  const { recentOpinions, loading } = useBuyerData();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-2">
          My Opinions
        </h1>
        <p className="text-lg text-slate-600">
          Opinions and offers you&apos;ve submitted.
        </p>
      </motion.div>

      {loading && recentOpinions.length === 0 && (
        <div className="text-sm text-slate-400">Loading…</div>
      )}

      {!loading && recentOpinions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-violet-600" strokeWidth={2.25} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            No opinions yet
          </h3>
          <p className="text-base text-slate-600 mb-8 max-w-md mx-auto">
            Share what you&apos;d pay on any listing to see it appear here.
          </p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all"
          >
            Browse listings
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {recentOpinions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          {recentOpinions.map((o, i) => {
            const label =
              SERIOUSNESS_LABELS[o.seriousnessLevel] ||
              o.seriousnessLevel ||
              '—';
            const tone = SERIOUSNESS_TONE[o.seriousnessLevel] || 'bg-slate-100 text-slate-600';
            return (
              <motion.button
                key={o.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                onClick={() =>
                  window.open(
                    `/find-property?propertyId=${o.propertyId}`,
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
                className="group w-full text-left bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 items-center justify-center text-violet-600 flex-shrink-0">
                    <MessageSquare className="w-5 h-5" strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1.5">
                      <span className="text-xs font-semibold text-slate-500">
                        {formatDate(o.createdAt)}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tone}`}>
                        {label}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-slate-900 truncate">
                      {o.propertyAddress ||
                        o.address ||
                        o.propertyId ||
                        'Property'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="text-2xl font-bold tracking-tight text-slate-900">
                      {formatAmount(o.amount ?? o.price ?? o.opinionAmount)}
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
