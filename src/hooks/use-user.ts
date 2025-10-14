
'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/schema';
import { mockUser } from '@/lib/data';

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
