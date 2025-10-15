
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enablePersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// Note: Replace this with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAO3uFKtPRIheJghLWDOBBdmj0eZe0eYDQ",
  authDomain: "fynix-new-auth-fix.firebaseapp.com",
  projectId: "fynix-new-auth-fix",
  storageBucket: "fynix-new-auth-fix.appspot.com",
  messagingSenderId: "367098418044",
  appId: "1:367098418044:web:0f4e3c938c62c2f7b1b3a1"
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let persistenceEnabled = false;

export async function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);

    if (!persistenceEnabled) {
      try {
        await enablePersistence(firestore, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        });
        persistenceEnabled = true;
      } catch (err: any) {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one.
          // This is a normal scenario.
        } else if (err.code === 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence.
        }
        console.warn("Firestore persistence could not be enabled:", err.message);
      }
    }
  } else {
    app = getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
  }

  return { app, auth, firestore };
}


export {
  useAuth,
  useFirebaseApp,
  useFirestore,
  FirebaseProvider,
} from './provider';

export { FirebaseClientProvider } from './client-provider';
