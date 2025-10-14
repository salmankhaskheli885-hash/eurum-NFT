
'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/schema';
import { mockUser } from '@/lib/data';

// MOCK IMPLEMENTATION:
// This hook is modified to return a mock user by default.
// This is a workaround for the persistent 'auth/unauthorized-domain' error,
// allowing development to proceed without a real authentication blockage.

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate a successful login with the mock user.
    setUser(mockUser);
    setLoading(false);
  }, []);

  return { user, loading, error };
}
