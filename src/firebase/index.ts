
'use client';
// This file is simplified to re-export the core Firebase utilities.
// Initialization logic is now centralized in FirebaseClientProvider.

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  let app: FirebaseApp;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}


export { FirebaseProvider, useAuth, useFirebaseApp, useFirestore, FirebaseContext } from './provider';
export { FirebaseClientProvider } from './client-provider';
