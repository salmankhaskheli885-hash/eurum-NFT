
'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/schema';
import { useAuth } from '@/firebase/provider';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getOrCreateUser } from '@/lib/data';

/**
 * This hook provides the currently logged-in user's profile and authentication state.
 * It listens to Firebase's auth state changes and provides the user object.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
        setLoading(false); // If no auth provider, stop loading.
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // This function now gets the user from our mock data store or creates them.
        // It always returns the most up-to-date user profile.
        const userProfile = getOrCreateUser(firebaseUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Auth state change error:", error);
        setError(error);
        setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  return { user, loading, error };
}

