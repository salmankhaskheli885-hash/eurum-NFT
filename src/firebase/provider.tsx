
'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// This defines the shape of the context value.
export type FirebaseContextValue = {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
};

// Create the context with an initial undefined value.
export const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

type FirebaseProviderProps = {
  children: React.ReactNode;
  value: FirebaseContextValue;
};

/**
 * This provider simply takes the initialized Firebase instances (app, auth, firestore)
 * and makes them available to all child components through the `FirebaseContext`.
 */
export function FirebaseProvider({
  children,
  value,
}: FirebaseProviderProps) {
  return (
      <FirebaseContext.Provider value={value}>
          {children}
      </FirebaseContext.Provider>
  );
}


// These are the custom hooks that components will use to access Firebase services.
export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.app;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
};
