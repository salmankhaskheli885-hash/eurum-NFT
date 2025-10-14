'use client';

import { type ReactNode, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './index';

// This component ensures Firebase is initialized only once on the client.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
    const app = useMemo(() => {
        const apps = getApps();
        if (apps.length > 0) {
            return apps[0];
        }
        return initializeApp(firebaseConfig);
    }, []);

    return <FirebaseProvider app={app}>{children}</FirebaseProvider>;
}
