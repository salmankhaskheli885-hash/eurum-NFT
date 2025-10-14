
'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { type Auth, getAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';
import { app, type FirebaseApp } from '@/firebase';

type FirebaseContextValue = {
  auth: Auth;
  firestore: Firestore;
  app: FirebaseApp;
};

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const contextValue = useMemo(() => {
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        return { app, auth, firestore };
    }, []);

    return (
        <FirebaseContext.Provider value={contextValue}>
            {children}
        </FirebaseContext.Provider>
    );
}

export function useAuth(): Auth {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
}

export function useFirestore(): Firestore {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
}

export function useFirebaseApp(): FirebaseApp {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebaseApp must be used within a FirebaseProvider');
    }
    return context.app;
}
