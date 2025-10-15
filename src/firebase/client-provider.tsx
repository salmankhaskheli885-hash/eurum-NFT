
'use client';

import { useEffect, useState } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { FirebaseContext, FirebaseProvider } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';

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
    // You can return a global loading spinner here if you want
    return <div className="flex h-screen w-screen items-center justify-center"><Skeleton className="h-20 w-20 rounded-full" /></div>;
  }

  return (
    <FirebaseContext.Provider value={{ ...firebase, loading: loading }}>
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
