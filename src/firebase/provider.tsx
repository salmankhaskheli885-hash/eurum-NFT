
'use client';

import { createContext, useContext, type ReactNode, useMemo } from 'react';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

type FirebaseContextValue = {
  auth: Auth;
  firestore: Firestore;
  app: FirebaseApp;
};

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

const firebaseConfig = {
    "projectId": "earnify-7f26c",
    "appId": "1:484358708808:web:79c5ccf925865239cb427d",
    "apiKey": "AIzaSyAPAkx06OCDGxuiXaX2D9U0MSWDyGRjkoY",
    "authDomain": "earnify-7f26c.firebaseapp.com",
    "storageBucket": "earnify-7f26c.appspot.com",
    "messagingSenderId": "484358708808"
};

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const value = useMemo(() => {
        const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        return { app, auth, firestore };
    }, []);

    return (
        <FirebaseContext.Provider value={value}>
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
