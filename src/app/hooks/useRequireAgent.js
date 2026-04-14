'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { isBuyerOnly } from '../utils/roles';

/**
 * Hook that redirects buyer-only users off agent-only pages.
 * Call at the top of every /dashboard/* route.
 */
export function useRequireAgent() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (isBuyerOnly(userData)) {
      router.replace('/buyer-dashboard');
    }
  }, [user, userData, loading, router]);
}
