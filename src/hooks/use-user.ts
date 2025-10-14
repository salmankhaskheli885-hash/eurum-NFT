
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase/provider';
import type { UserProfile } from '@/lib/schema';

// This hook now uses the real Firebase authentication state.
export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth || !firestore) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (authUser: User | null) => {
      if (authUser) {
        // User is signed in, listen to their profile document.
        const userRef = doc(firestore, 'users', authUser.uid);
        const userProfileUnsubscribe = onSnapshot(userRef, 
          (doc) => {
            if (doc.exists()) {
              setUser(doc.data() as UserProfile);
            } else {
              // This case can happen if the user's document hasn't been created yet.
              // For a brief moment, the user might be null before the profile is created on sign-in.
              setUser(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching user profile:", err);
            setError(err);
            setLoading(false);
          }
        );

        return () => userProfileUnsubscribe();
      } else {
        // User is signed out.
        setUser(null);
        setLoading(false);
      }
    }, (err) => {
        console.error("Auth state error:", err);
        setError(err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, loading, error };
}
