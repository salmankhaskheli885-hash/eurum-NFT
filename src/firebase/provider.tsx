
'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { app, auth, firestore, type Auth, type Firestore, type FirebaseApp } from '@/firebase';

type FirebaseContextValue = {
  auth: Auth;
  firestore: Firestore;
  app: FirebaseApp;
};

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const contextValue = useMemo(() => ({
        app,
        auth,
        firestore
    }), []);

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
