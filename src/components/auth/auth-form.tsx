
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore } from '@/firebase/provider';
import { GoogleAuthProvider, signInWithPopup, getRedirectResult, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/schema';

function GoogleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width="24px"
            height="24px"
        >
            <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            />
            <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.999,36.661,44,31.1,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
        </svg>
    );
}

// This component uses real Google Sign-In and handles user profile creation.
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);

  const handleUser = async (user: User) => {
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // New user, create profile
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'user', // Default role
        shortUid: user.uid.substring(0, 8),
        balance: 0,
        currency: 'PKR',
        vipLevel: 1,
        vipProgress: 0,
        kycStatus: 'unsubmitted',
        referralLink: `https://fynix.pro/ref/${user.uid.substring(0, 8)}`,
      };
      await setDoc(userRef, newUserProfile);
    }
    // Existing user data is already there.

    toast({
      title: 'Sign In Successful!',
      description: 'Redirecting to your dashboard...',
    });

    router.push('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleUser(result.user);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let title = "An unexpected error occurred";
      let description = "Please try again later or contact support.";

      if (error.code === 'auth/popup-closed-by-user') {
          title = 'Sign-In Cancelled';
          description = 'The sign-in popup was closed. Please try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
          title = 'Domain Not Authorized';
          description = "This app's domain is not authorized for sign-in. Please contact support.";
      } else {
          description = `Error: ${error.message}`;
      }

      toast({
        variant: 'destructive',
        title: title,
        description: description,
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
        <Button 
            variant="outline" 
            className="w-full h-12 text-base"
            onClick={handleGoogleSignIn}
            disabled={loading}
        >
            <GoogleIcon className="mr-2 h-6 w-6" />
            {loading ? 'Processing...' : `Sign in with Google`}
        </Button>
      
       <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
