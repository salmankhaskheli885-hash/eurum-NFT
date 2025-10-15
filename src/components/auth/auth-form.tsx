
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { useFirebaseApp, useFirestore } from '@/firebase/provider';
import type { UserProfile } from '@/lib/schema';
import { getOrCreateUser } from '@/lib/firestore'; // Import getOrCreateUser
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter
} from "@/components/ui/alert-dialog"
import Link from 'next/link';


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

function RoleSelectionDialog({ open, onSelectRole }: { open: boolean, onSelectRole: (role: 'admin' | 'user' | 'partner') => void }) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Select Your Role</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are logged in as an administrator. Please choose which panel you would like to access.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                    <Button onClick={() => onSelectRole('admin')} className="w-full">Go to Admin Panel</Button>
                    <Button onClick={() => onSelectRole('user')} variant="outline" className="w-full">Go to User Panel</Button>
                    <Button onClick={() => onSelectRole('partner')} variant="secondary" className="w-full">Go to Partner Panel</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


export function AuthForm({ role: intendedRole }: { role: 'user' | 'partner' }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const app = useFirebaseApp();
  const firestore = useFirestore();
  
  const handleRoleSelection = (selectedRole: 'admin' | 'user' | 'partner') => {
      setShowRoleDialog(false);
      setLoading(true);
      toast({
          title: "Redirecting...",
      });
      switch (selectedRole) {
          case 'admin':
              router.push('/admin');
              break;
          case 'user':
              router.push('/dashboard');
              break;
          case 'partner':
              router.push('/partner');
              break;
      }
  };

  const handleGoogleSignIn = async () => {
    if (!app || !firestore) {
        toast({
            variant: "destructive",
            title: "Authentication service not ready",
            description: "Please wait a moment and try again.",
        });
        return;
    }
    setLoading(true);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        // Get or create the user profile from Firestore to get their role
        const userProfile = await getOrCreateUser(firestore, firebaseUser);
        
        toast({
            title: t('login.successTitle'),
            description: `Welcome, ${userProfile.displayName}!`,
        });

        if (userProfile.role === 'admin') {
            setShowRoleDialog(true);
            setLoading(false);
            return;
        }

        // Redirect based on the role stored in Firestore
        switch(userProfile.role) {
            case 'partner':
                router.push('/partner');
                break;
            case 'user':
            default:
                router.push('/dashboard');
                break;
        }
        
    } catch (error: any) {
        let title = 'An unknown error occurred';
        let description = 'Please try again later.';

        if (error && error.code) {
            if (error.code === 'auth/unauthorized-domain') {
                title = "Domain Not Authorized";
                description = "This domain is not authorized for sign-in. Please add it to your Firebase project's authorized domains list.";
            } else {
                title = 'Authentication Error';
                description = error.message;
            }
        }
        
        toast({
            variant: "destructive",
            title: title,
            description: description,
        });

    } finally {
        if (!showRoleDialog) {
           setLoading(false);
        }
    }
  };

  return (
    <>
        <RoleSelectionDialog open={showRoleDialog} onSelectRole={handleRoleSelection} />
        <div className="space-y-4 pt-6">
            <Button 
                variant="outline" 
                className="w-full h-12 text-base"
                onClick={handleGoogleSignIn}
                disabled={loading}
            >
                <GoogleIcon className="mr-2 h-6 w-6" />
                {loading ? t('login.processing') : (intendedRole === 'partner' ? t('login.buttonPartner') : t('login.googleButton'))}
            </Button>
        
        <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our Terms of Service and Privacy Policy.
        </p>
        </div>
    </>
  );
}
