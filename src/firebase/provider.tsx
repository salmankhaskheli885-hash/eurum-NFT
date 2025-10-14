import type { ReactNode } from 'react';
import { FirebaseClientProvider } from './client-provider';

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
