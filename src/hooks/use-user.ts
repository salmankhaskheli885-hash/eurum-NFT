
'use client';

import { useEffect, useState } from 'react';
import type { User as AuthUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase/provider';
import type { UserProfile } from '@/lib/schema';

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (authUser: AuthUser | null) => {
        if (authUser) {
          try {
            const userRef = doc(firestore, 'users', authUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              setUser(userSnap.data() as UserProfile);
            } else {
              // Create a new user profile if it doesn't exist
              const newUser: UserProfile = {
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
              await setDoc(userRef, newUser);
              setUser(newUser);
            }
          } catch (e: any) {
            console.error("Error fetching or creating user document:", e);
            setError(e);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, loading, error };
}
