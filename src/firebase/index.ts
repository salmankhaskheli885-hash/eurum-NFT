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

// This is an auto-generated file that represents the Firebase project
// configuration object. As this is a public configuration, it is safe to leave
// this file in your source control. See https://firebase.google.com/docs/web/start
// for more information.
export const firebaseConfig = {
  "projectId": "earnify-7f26c",
  "appId": "1:484358708808:web:79c5ccf925865239cb427d",
  "apiKey": "AIzaSyAPAkx06OCDGxuiXaX2D9U0MSWDyGRjkoY",
  "authDomain": "earnify-7f26c.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "484358708808"
};


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
      try {
        getAnalytics(app);
      } catch (e) {
        console.error("Failed to initialize Analytics", e);
      }
    }
    return { app, auth, firestore };
  } else {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    if (typeof window !== 'undefined') {
      try {
        getAnalytics(app);
      } catch (e) {
        console.error("Failed to initialize Analytics", e);
      }
    }
    return { app, auth, firestore };
  }
}
