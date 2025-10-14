'use client';

import { type ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { app } from './index';

// This component ensures Firebase is initialized only once on the client.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
    return <FirebaseProvider app={app}>{children}</FirebaseProvider>;
}
