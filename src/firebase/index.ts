
'use client';
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

// This is the correct and permanent Firebase config for your project.
const firebaseConfig = {
    "projectId": "earnify-7f26c",
    "appId": "1:484358708808:web:79c5ccf925865239cb427d",
    "apiKey": "AIzaSyAPAkx06OCDGxuiXaX2D9U0MSWDyGRjkoY",
    "authDomain": "earnify-7f26c.firebaseapp.com",
    "storageBucket": "earnify-7f26c.appspot.com",
    "messagingSenderId": "484358708808"
};


let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// Initialize Firebase only once
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);
} else {
  app = getApp();
  auth = getAuth(app);
  firestore = getFirestore(app);
}

export function initializeFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  return { app, auth, firestore };
}
