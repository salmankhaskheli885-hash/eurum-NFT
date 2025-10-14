'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { type Auth, getAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';
import { type FirebaseApp } from 'firebase/app';

type FirebaseContextValue = {
  auth: Auth;
  firestore: Firestore;
  app: FirebaseApp;
};

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children, app }: { children: ReactNode, app: FirebaseApp }) {
    const contextValue = useMemo(() => {
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        return { app, auth, firestore };
    }, [app]);

    return (
        <FirebaseContext.Provider value={contextValue}>
            {children}
        </FirebaseContext.Provider>
    );
}

export function useAuth(): Auth | null {
  const context = useContext(FirebaseContext);
  return context?.auth ?? null;
}

export function useFirestore(): Firestore | null {
  const context = useContext(FirebaseContext);
  return context?.firestore ?? null;
}

export function useFirebaseApp(): FirebaseApp | null {
    const context = useContext(FirebaseContext);
    return context?.app ?? null;
}
