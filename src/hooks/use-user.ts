
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase/provider';
import type { UserProfile } from '@/lib/schema';

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
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser: User | null) => {
        if (authUser) {
          const userRef = doc(firestore, 'users', authUser.uid);
          
          const unsubscribeSnapshot = onSnapshot(userRef, 
            (docSnap) => {
              if (docSnap.exists()) {
                setUser(docSnap.data() as UserProfile);
              } else {
                // This case might happen if the user's document hasn't been created yet.
                // We'll set a basic profile and wait for the full profile creation.
                setUser({
                  uid: authUser.uid,
                  email: authUser.email,
                  displayName: authUser.displayName,
                  role: 'user', // Default role assumption
                  balance: 0,
                  currency: 'PKR',
                  shortUid: authUser.uid.substring(0, 8),
                  vipLevel: 1,
                  vipProgress: 0,
                  kycStatus: 'unsubmitted',
                  referralLink: '',
                });
              }
              setLoading(false);
            },
            (snapshotError) => {
              console.error("Error fetching user profile:", snapshotError);
              setError(snapshotError);
              setLoading(false);
            }
          );

          // Return the snapshot listener's unsubscribe function
          return () => unsubscribeSnapshot();
        } else {
          setUser(null);
          setLoading(false);
        }
      },
      (authError) => {
        console.error("Authentication error:", authError);
        setError(authError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, loading, error };
}
