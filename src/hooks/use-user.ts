
'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/schema';
import { mockUser } from '@/lib/data';

// This hook simulates a logged-in user to bypass Firebase Auth issues.
export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Immediately set the mock user and stop loading.
    setUser(mockUser);
    setLoading(false);
  }, []);

  return { user, loading, error: null };
}
