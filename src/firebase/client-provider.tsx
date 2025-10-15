
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';

type FirebaseClientContextValue = {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
};

const FirebaseClientContext = createContext<FirebaseClientContextValue>({
  app: null,
  auth: null,
  firestore: null,
});

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseClientContextValue | null>(null);

  useEffect(() => {
    // This function ensures Firebase is initialized only once
    const init = async () => {
      const firebaseInstance = await initializeFirebase();
      setFirebase(firebaseInstance);
    };

    if (typeof window !== 'undefined' && !firebase) {
      init();
    }
  }, [firebase]);

  if (!firebase || !firebase.app) {
    // You can return a loader here. Returning null for now prevents children from rendering prematurely.
    return null;
  }

  return (
    <FirebaseProvider
      app={firebase.app}
      auth={firebase.auth as Auth}
      firestore={firebase.firestore as Firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

export const useFirebaseClient = () => {
    const context = useContext(FirebaseClientContext);
    if (context === undefined) {
        throw new Error('useFirebaseClient must be used within a FirebaseClientProvider');
    }
    return context;
};
