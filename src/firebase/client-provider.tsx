
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
  loading: boolean;
};

const FirebaseClientContext = createContext<FirebaseClientContextValue>({
  app: null,
  auth: null,
  firestore: null,
  loading: true,
});

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<Omit<FirebaseClientContextValue, 'loading'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function ensures Firebase is initialized only once on the client
    const init = async () => {
      const firebaseInstance = await initializeFirebase();
      setFirebase(firebaseInstance);
      setLoading(false);
    };

    if (typeof window !== 'undefined' && !firebase) {
      init();
    }
  }, [firebase]);

  if (loading || !firebase || !firebase.app) {
    // You can return a global loader here if you want
    return null; // Prevents children from rendering until Firebase is ready
  }

  return (
    <FirebaseContext.Provider value={{ ...firebase, loading }}>
        <FirebaseProvider
            app={firebase.app}
            auth={firebase.auth as Auth}
            firestore={firebase.firestore as Firestore}
        >
            {children}
        </FirebaseProvider>
    </FirebaseContext.Provider>
  );
}

export const useFirebaseClient = () => {
    const context = useContext(FirebaseClientContext);
    if (context === undefined) {
        throw new Error('useFirebaseClient must be used within a FirebaseClientProvider');
    }
    return context;
};
