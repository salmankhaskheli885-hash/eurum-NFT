'use client';

import { type ReactNode, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './index';

// This component ensures Firebase is initialized only once on the client.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
    const app = useMemo(() => {
        return getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    }, []);

    return <FirebaseProvider app={app}>{children}</FirebaseProvider>;
}
