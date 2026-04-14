'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, StickyNote, Star, Check, X } from 'lucide-react';
import { useBuyerData } from '../hooks/useBuyerData';
import BuyerPropertyCard from '../components/BuyerPropertyCard';
import { authFetch } from '../../utils/authFetch';

function LikedCard({ like, delay, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(like.notes || '');
  const [rating, setRating] = useState(like.rating || 0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  // Keep local in sync if parent state changes
  useEffect(() => {
    setNotes(like.notes || '');
    setRating(like.rating || 0);
  }, [like.notes, like.rating]);

  async function save() {
    setSaving(true);
    try {
      const res = await authFetch('/api/buyer/like-meta', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: like.propertyId,
          notes,
          rating,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      setSavedAt(Date.now());
      onUpdate?.({ ...like, notes, rating });
      setTimeout(() => setEditing(false), 600);
    } catch (err) {
      console.error('like-meta save error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col"
    >
      <BuyerPropertyCard property={like.property} delay={0} />

      {/* Notes/rating row sits below the card */}
      <div className="-mt-2 mx-3 bg-white border border-t-0 border-slate-200 rounded-b-3xl px-4 py-3">
        {!editing && !notes && rating === 0 && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600 transition-colors"
          >
            <StickyNote className="w-4 h-4" />
            <span className="font-medium">Add notes or rating</span>
          </button>
        )}

        {!editing && (notes || rating > 0) && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full text-left group"
          >
            {rating > 0 && (
              <div className="flex items-center gap-0.5 mb-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${
                      n <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            )}
            {notes && (
              <p className="text-xs text-slate-600 line-clamp-2 group-hover:text-slate-900 transition-colors">
                {notes}
              </p>
            )}
          </button>
        )}

        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(rating === n ? 0 : n)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          n <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anything you want to remember about this place..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {savedAt > 0 ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Saved
                      </>
                    ) : saving ? (
                      'Saving…'
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function LikedPropertiesPage() {
  const { likedProperties, loading, refetchLiked } = useBuyerData();
  const [localOverrides, setLocalOverrides] = useState({});

  // Merge local notes/rating overrides into the parent data so the UI is
  // immediately responsive without re-fetching the world
  const merged = likedProperties.map((l) => ({
    ...l,
    ...(localOverrides[l.id] || {}),
  }));

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-2">
          Liked Properties
        </h1>
        <p className="text-lg text-slate-600">
          Everything you&apos;ve saved in one place — add notes and ratings to
          remember why.
        </p>
      </motion.div>

      {loading && merged.length === 0 && (
        <div className="text-sm text-slate-400">Loading…</div>
      )}

      {!loading && merged.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
            <Heart className="w-10 h-10 text-orange-500" strokeWidth={2.25} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            No favourites yet
          </h3>
          <p className="text-base text-slate-600 mb-8 max-w-md mx-auto">
            Tap the heart on any listing and it&apos;ll show up right here.
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

      {merged.length > 0 && (
        <div
          onClickCapture={() => setTimeout(refetchLiked, 400)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {merged.map((like, i) => (
            <LikedCard
              key={like.id}
              like={like}
              delay={0.05 * i}
              onUpdate={(updated) =>
                setLocalOverrides((prev) => ({
                  ...prev,
                  [like.id]: updated,
                }))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
