
'use client';

import { useEffect, useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseProvider, type FirebaseContextValue } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

/**
 * This is the most important provider. It ensures that Firebase is initialized
 * ONLY on the client-side, and only ONCE. It displays a loading indicator
 * until Firebase is ready, preventing any child components from accessing
 * Firebase services prematurely and causing the "client is offline" error.
 */
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
      setFirebase(firebaseInstance as FirebaseContextValue);
    };

    // Check if running on the client and Firebase is not already initialized
    if (typeof window !== 'undefined' && !firebase) {
      init();
    }
  // We ONLY want this to run once, so we leave the dependency array empty.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // While Firebase is initializing, show a loading indicator.
  // This is the key to preventing the "client is offline" error.
  if (!firebase) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-20 w-20 animate-spin text-primary" />
      </div>
    );
  }

  // Once Firebase is ready, render the FirebaseProvider with the initialized instances.
  return (
    <FirebaseProvider value={firebase}>
      {children}
    </FirebaseProvider>
  );
}
