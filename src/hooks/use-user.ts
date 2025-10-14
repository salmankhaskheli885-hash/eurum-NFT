
'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/schema';
import { useAuth } from '@/firebase/provider';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

/**
 * This hook provides the currently logged-in user's profile and authentication state.
 * It listens to Firebase's auth state changes and provides the user object.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        // This might happen if Firebase hasn't initialized yet.
        // The provider should handle this, but as a safeguard:
        console.warn("Firebase Auth is not available yet.");
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // In a real application, you would fetch the user's profile
        // from Firestore here based on their UID.
        // For this simulation, we'll construct a profile from the auth object
        // and supplement with mock data.
        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          // Default values, would be fetched from Firestore
          role: 'user', 
          shortUid: firebaseUser.uid.substring(0, 8),
          balance: 133742.00,
          currency: 'PKR',
          vipLevel: 2,
          vipProgress: 65,
          kycStatus: 'approved',
          referralLink: `https://fynix.pro/ref/${firebaseUser.uid.substring(0, 8)}`,
        };
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
