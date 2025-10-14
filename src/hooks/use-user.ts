
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        
        // Determine user role based on email for this simulation
        const isAdmin = firebaseUser.email === 'satoshi@fynix.pro';
        const isPartner = firebaseUser.email === 'vitalik@fynix.pro';
        let role: UserProfile['role'] = 'user';
        if (isAdmin) {
          role = 'admin';
        } else if (isPartner) {
          role = 'partner';
        }

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: role, 
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
