
'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
    "projectId": "earnify-7f26c",
    "appId": "1:484358708808:web:79c5ccf925865239cb427d",
    "apiKey": "AIzaSyAPAkx06OCDGxuiXaX2D9U0MSWDyGRjkoY",
    "authDomain": "earnify-7f26c.firebaseapp.com",
    "storageBucket": "earnify-7f26c.appspot.com",
    "messagingSenderId": "484358708808"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
export type { FirebaseApp, Auth, Firestore };
