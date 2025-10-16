
'use client';

import { useEffect, useState } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { FirebaseProvider, type FirebaseContextValue } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseContextValue | null>(null);

  useEffect(() => {
    // This function ensures Firebase is initialized only on the client side.
    const init = () => {
      const firebaseInstance = initializeFirebase();
      setFirebase(firebaseInstance);
    };

    // Check if running on the client and Firebase is not already initialized
    if (typeof window !== 'undefined' && !firebase) {
      init();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebase]);

  // While Firebase is initializing, show a loading indicator.
  // This prevents any child components from trying to use Firebase before it's ready.
  if (!firebase) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-20 w-20 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <FirebaseProvider value={firebase}>
      {children}
    </FirebaseProvider>
  );
}
