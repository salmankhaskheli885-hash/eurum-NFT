
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile } from '@/lib/schema';
import { useAuth, useFirestore } from '@/firebase/provider';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getOrCreateUser, listenToUser } from '@/lib/firestore';

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
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    let authUnsubscribe: (() => void) | null = null;
    
    if (!firestore) {
        setLoading(false);
        return;
    }

    if (viewAsUserId) {
        // Admin is viewing a specific user profile
        unsubscribe = listenToUser(firestore, viewAsUserId, (userProfile) => {
            setUser(userProfile);
            setLoading(false);
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }
    
    if (!auth) {
        setLoading(false);
        return;
    }

    authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up previous user listener
      if (unsubscribe) unsubscribe();

      if (firebaseUser) {
        // Ensure user document exists before listening
        await getOrCreateUser(firestore, firebaseUser);
        
        // Listen for real-time updates to the user's document
        unsubscribe = listenToUser(firestore, firebaseUser.uid, (userProfile) => {
            setUser(userProfile);
            setLoading(false);
        });

      } else {
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
