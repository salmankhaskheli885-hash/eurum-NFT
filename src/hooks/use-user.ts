
'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/schema';
import { useAuth, useFirestore } from '@/firebase/provider';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { listenToUser } from '@/lib/firestore';

/**
 * This hook provides the currently logged-in user's profile and authentication state in real-time.
 * It listens to Firebase's auth state changes and user document changes in Firestore.
 * It can also be used by an admin to view a specific user's profile by passing a `viewAsUserId`.
 */
export function useUser({ viewAsUserId }: { viewAsUserId?: string | null } = {}) {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    // Function to start listening to a user's document
    const subscribeToUser = (uid: string) => {
        if (!firestore) return;
        setLoading(true);
        unsubscribe = listenToUser(firestore, uid, (userProfile) => {
            setUser(userProfile);
            setLoading(false);
        });
    };

    // If an admin is viewing a specific user, bypass auth state
    if (viewAsUserId) {
        subscribeToUser(viewAsUserId);
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }

    // For regular users, wait for auth state
    if (!auth || !firestore) {
        setLoading(false);
        return;
    }

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      // Clean up previous Firestore listener if auth state changes
      if (unsubscribe) unsubscribe();

      if (firebaseUser) {
        // User is logged in, start listening to their Firestore document
        subscribeToUser(firebaseUser.uid);
      } else {
        // User is not logged in
        setUser(null);
        setLoading(false);
      }
    }, (error) => {
        console.error("Auth state change error:", error);
        setError(error);
        setLoading(false);
    });

    // Cleanup subscriptions on unmount
    return () => {
        if (authUnsubscribe) authUnsubscribe();
        if (unsubscribe) unsubscribe();
    };
  }, [auth, firestore, viewAsUserId]); 

  return { user, loading, error };
}
