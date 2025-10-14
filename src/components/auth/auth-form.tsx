
'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';

import { Button } from '@/components/ui/button';
import { useAuth, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/schema';
import { useTranslation } from '@/hooks/use-translation';

export function AuthForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase not initialized.' });
      return;
    }
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const authUser = userCredential.user;

      const userDocRef = doc(firestore, 'users', authUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userProfile: UserProfile;

      if (!userDocSnap.exists()) {
        // User is signing in for the first time, create a profile
        const shortUid = authUser.uid.substring(0, 8);
        userProfile = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          role: 'user', // Default role for new users
          shortUid,
          balance: 0,
          currency: 'PKR',
          vipLevel: 1,
          vipProgress: 0,
          kycStatus: 'unsubmitted',
          referralLink: `https://fynix.pro/ref/${shortUid}`,
        };
        await setDoc(userDocRef, userProfile);
        toast({ title: "Welcome!", description: "Your account has been created." });
      } else {
        // User exists, get their profile
        userProfile = userDocSnap.data() as UserProfile;
        toast({ title: t('login.successTitle') });
      }

      // Redirect based on role
      switch (userProfile.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'partner':
          router.push('/partner');
          break;
        case 'user':
        default:
          router.push('/dashboard');
          break;
      }
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred during sign-in.";
      if (error instanceof FirebaseError) {
          switch (error.code) {
              case 'auth/popup-closed-by-user':
                  errorMessage = "Sign-in popup was closed. Please try again.";
                  break;
              case 'auth/cancelled-popup-request':
                  errorMessage = "Multiple sign-in attempts detected. Please try again.";
                  break;
              default:
                  errorMessage = `Firebase error: ${error.message}`;
                  break;
          }
      }
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={handleGoogleSignIn} className="w-full" disabled={loading}>
        {loading ? t('login.processing') : t('login.googleButton')}
      </Button>
    </div>
  );
}
