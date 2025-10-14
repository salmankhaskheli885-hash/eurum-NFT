'use client';

import { useEffect, useState } from 'react';
import { mockUser } from '@/lib/data';
import type { UserProfile } from '@/lib/schema';

/**
 * This is a mock implementation of the useUser hook.
 * It bypasses Firebase Authentication and returns a static mock user.
 * This is a workaround for the "domain not authorized" issue in the Firebase project settings.
 */
export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching the user
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 500);
  }, []);

  return { user, loading, error: null };
}
