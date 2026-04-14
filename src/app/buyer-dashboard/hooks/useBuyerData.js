'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase/clientApp';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/authFetch';

/**
 * Shared hook that loads liked properties, watched areas, and recent opinions
 * for the current buyer. Exposes refetch helpers so tabs stay in sync.
 */
export function useBuyerData() {
  const { user } = useAuth();
  const [likedProperties, setLikedProperties] = useState([]);
  const [watchedAreas, setWatchedAreas] = useState([]);
  const [recentOpinions, setRecentOpinions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiked = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/buyer/liked-properties');
      if (!res.ok) throw new Error('liked fetch failed');
      const data = await res.json();
      setLikedProperties(data.likes || []);
    } catch (err) {
      console.error('fetchLiked error:', err);
    }
  }, [user]);

  const fetchAreas = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/buyer/watched-areas');
      if (!res.ok) throw new Error('areas fetch failed');
      const data = await res.json();
      setWatchedAreas(data.areas || []);
    } catch (err) {
      console.error('fetchAreas error:', err);
    }
  }, [user]);

  const fetchOpinions = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'offers'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() ?? a.createdAt?._seconds * 1000 ?? 0;
        const bt = b.createdAt?.toMillis?.() ?? b.createdAt?._seconds * 1000 ?? 0;
        return bt - at;
      });
      setRecentOpinions(rows);
    } catch (err) {
      console.error('fetchOpinions error:', err);
    }
  }, [user]);

  const refetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchLiked(), fetchAreas(), fetchOpinions()]);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchLiked, fetchAreas, fetchOpinions]);

  useEffect(() => {
    if (!user) return;
    refetchAll();
  }, [user, refetchAll]);

  return {
    likedProperties,
    watchedAreas,
    recentOpinions,
    loading,
    error,
    refetchLiked: fetchLiked,
    refetchAreas: fetchAreas,
    refetchOpinions: fetchOpinions,
    refetchAll,
  };
}
