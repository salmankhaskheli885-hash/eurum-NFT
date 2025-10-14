'use client';

import { type ReactNode, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './index'; // Import config directly

// This component ensures Firebase is initialized only once on the client.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
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

    // Don't render children until the app is initialized
    if (!app) {
        return null; 
    }

    return <FirebaseProvider app={app}>{children}</FirebaseProvider>;
}
