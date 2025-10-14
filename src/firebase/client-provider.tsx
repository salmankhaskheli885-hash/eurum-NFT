'use client';

import { type ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseProvider } from './provider';
import { initializeApp, getApps, type FirebaseApp, getApp } from 'firebase/app';
import { firebaseConfig } from './index';

let firebaseApp: FirebaseApp;

try {
  firebaseApp = getApp();
} catch (e) {
  firebaseApp = initializeApp(firebaseConfig);
}

// This component ensures Firebase is initialized only once on the client.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const app = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    
    // This logic ensures we get the existing app instance or initialize it.
    // It's a robust way to handle Firebase initialization in Next.js
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0];
    }
    return initializeApp(firebaseConfig);
  }, []);


  // On the server, we render nothing. On the client, once mounted, we render the provider.
  // This prevents hydration mismatches.
  if (!isMounted || !app) {
    return null;
  }

  return <FirebaseProvider app={app}>{children}</FirebaseProvider>;
}
