
'use client';

import { useEffect, useState } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { FirebaseProvider, FirebaseContext } from '@/firebase/provider';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
  }>({ app: null, auth: null, firestore: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const firebaseInstance = await initializeFirebase();
      setFirebase(firebaseInstance);
      setLoading(false);
    };

    if (typeof window !== 'undefined' && !firebase.app) {
      init();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !firebase.app) {
    return null; // Or a loading spinner
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
