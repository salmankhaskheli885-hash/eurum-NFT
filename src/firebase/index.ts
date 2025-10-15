import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Note: Replace this with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD0ulSSjV6rQvsjWgRu8FPEcFzMWVafxPM",
  authDomain: "fynix-new-auth-fix.firebaseapp.com",
  projectId: "fynix-new-auth-fix",
  storageBucket: "fynix-new-auth-fix.appspot.com",
  messagingSenderId: "367098418044",
  appId: "1:367098418044:web:0f4e3c938c62c2f7b1b3a1"
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function initializeFirebase() {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}

export {
  useAuth,
  useFirebaseApp,
  useFirestore,
  FirebaseProvider,
} from './provider';

export { FirebaseClientProvider } from './client-provider';
