
'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// This defines the shape of the context value.
export type FirebaseContextValue = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

// Create the context with an initial null value.
// It will be populated by the FirebaseClientProvider.
export const FirebaseContext = createContext<FirebaseContextValue | null>(null);

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
  if (context === undefined || context === null) {
    throw new Error('useFirebaseApp must be used within a FirebaseClientProvider');
  }
  return context.app;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within a FirebaseClientProvider');
  }
  return context.auth;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined || context === null) {
    throw new Error('useFirestore must be used within a FirebaseClientProvider');
  }
  return context.firestore;
};
