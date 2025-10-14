
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase/provider';
import type { UserProfile } from '@/lib/schema';

// This is the primary hook to get the current user's profile data.
// It listens to Firebase Auth state changes and fetches the corresponding
// user profile from Firestore.

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth || !firestore) {
        setLoading(false);
        return;
    };

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userRef = doc(firestore, 'users', authUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser(userSnap.data() as UserProfile);
          } else {
            // This case handles a new user signing up.
            // We create their profile in Firestore for the first time.
            const newUserProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              role: 'user', // Default role
              shortUid: authUser.uid.substring(0, 8),
              balance: 0,
              currency: 'PKR',
              vipLevel: 1,
              vipProgress: 0,
              kycStatus: 'unsubmitted',
              referralLink: `https://fynix.pro/ref/${authUser.uid.substring(0, 8)}`,
            };
            await setDoc(userRef, newUserProfile);
            setUser(newUserProfile);
          }
        } catch (e: any) {
          console.error("Error fetching user profile:", e);
          setError(e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, loading, error };
}
