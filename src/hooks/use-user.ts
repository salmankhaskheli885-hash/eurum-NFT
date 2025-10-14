
'use client';

import { useEffect, useState } from 'react';
import { mockUser } from '@/lib/data';
import type { UserProfile } from '@/lib/schema';

/**
 * This is a mock implementation of the useUser hook.
 * It bypasses Firebase Authentication and returns a static mock user
 * AFTER a simulated delay. This is to avoid Firebase domain authorization issues
 * while still providing a realistic login flow.
 */
export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This simulates fetching a user. In a real scenario, this would be
    // onAuthStateChanged which provides the user object after login.
    // For now, we simulate that no user is logged in initially.
    const path = window.location.pathname;
    if (path.startsWith('/dashboard') || path.startsWith('/partner') || path.startsWith('/admin')) {
         // If we are on a protected route, simulate fetching the user.
        setTimeout(() => {
            setUser(mockUser);
            setLoading(false);
        }, 500);
    } else {
        // On public routes like /login, assume no user is logged in.
        setLoading(false);
    }
  }, []);

  return { user, loading, error: null };
}
