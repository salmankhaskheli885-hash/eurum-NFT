'use client';

import { type ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseProvider } from './provider';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './index';

// This component ensures Firebase is initialized only once on the client.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    setIsMounted(true);
  }, []);

  const app = useMemo(() => {
    // Ensure this only runs on the client
    if (typeof window === 'undefined') {
      return null;
    }

    const apps = getApps();
    if (apps.length > 0) {
      return apps[0];
    }
    
    // Initialize with the correct, imported config
    return initializeApp(firebaseConfig);
  }, []);

  // On the server and during the initial client render, we render nothing to avoid hydration mismatch.
  if (!isMounted || !app) {
    return null; 
  }

  // Once mounted on the client, we render the actual provider and children.
  return <FirebaseProvider app={app}>{children}</FirebaseProvider>;
}
