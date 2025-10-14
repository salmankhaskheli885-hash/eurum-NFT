
'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/schema';
import { mockUser } from '@/lib/data';

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This hook simulates a logged-in user by always returning the mockUser.
    // This is a workaround for the Firebase auth domain issue.
    // In a production environment, this would be replaced with real auth state logic.
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 500);
  }, []);

  return { user, loading, error: null };
}
