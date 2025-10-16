
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This function should be called only on the client side.
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


export {
  useAuth,
  useFirebaseApp,
  useFirestore,
  FirebaseProvider,
  FirebaseContext,
} from './provider';

export { FirebaseClientProvider } from './client-provider';
