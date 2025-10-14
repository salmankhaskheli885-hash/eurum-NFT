'use client';
import { getAnalytics } from 'firebase/analytics';
import {
  FirebaseApp,
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';
import {
  Auth,
  getAuth,
} from 'firebase/auth';
import {
  Firestore,
  getFirestore,
} from 'firebase/firestore';

import { firebaseConfig } from '@/firebase/config';

export function initializeFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  const existingApp = getApps().length ? getApp() : null;
  if (existingApp) {
    const app = getApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    if (typeof window !== 'undefined') {
      getAnalytics(app);
    }
    return { app, auth, firestore };
  } else {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    if (typeof window !== 'undefined') {
      getAnalytics(app);
    }
    return { app, auth, firestore };
  }
}
