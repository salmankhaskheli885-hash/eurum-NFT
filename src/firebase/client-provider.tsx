
'use client';

import { useEffect, useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseProvider, type FirebaseContextValue } from '@/firebase/provider';
import { Logo } from '@/components/icons';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // This function ensures Firebase is initialized only on the client side.
    const init = () => {
      const firebaseInstance = initializeFirebase();
      setFirebase(firebaseInstance as FirebaseContextValue);
      
      const authUnsubscribe = onAuthStateChanged(firebaseInstance.auth, (user) => {
        // This is the first moment we know if the user is logged in or not.
        // We can now stop showing the loader.
        setAuthLoading(false);
      });
      
      return authUnsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    // Check if running on the client and Firebase is not already initialized
    if (typeof window !== 'undefined' && !firebase) {
      unsubscribe = init();
    }
    
    return () => {
        if(unsubscribe) {
            unsubscribe();
        }
    }
  // We ONLY want this to run once, so we leave the dependency array empty.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // While Firebase is initializing or auth state is being checked, show a loading indicator.
  if (!firebase || authLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <Logo className="h-24 w-24 animate-pulse text-primary duration-2000" />
        <p className="text-muted-foreground">Initializing Authentication...</p>
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
