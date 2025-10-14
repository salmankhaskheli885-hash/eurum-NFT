import { getAuth } from 'firebase-admin/auth';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import { redirect } from 'next/navigation';

// IMPORTANT: This file should only be used in SERVER-SIDE code.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

const adminApp = !getApps().length
  ? initializeApp({
      credential: credential.cert(JSON.parse(serviceAccount)),
    })
  : getApp();


export const adminAuth = getAuth(adminApp);


export async function signInWithGoogle(redirectUrl: string) {
    const provider = 'google.com';
    const authUrl = await adminAuth.createSignInLinkWithProvider(provider, redirectUrl);
    redirect(authUrl);
}
