
'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/schema';
import { mockUser } from '@/lib/data';

// WORKAROUND: This hook is mocked to bypass the persistent 'auth/unauthorized-domain' error.
// It no longer uses Firebase Auth but returns a static mock user.
// This ensures the application is usable for development and testing purposes
// without being blocked by the Firebase configuration issue.

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching the user by setting the mock user.
    setUser(mockUser);
    setLoading(false);
  }, []);

  // The error state is always null in this mocked version.
  const error = null;

  return { user, loading, error };
}
