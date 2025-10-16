
"use client"

import * as React from "react"
import { signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useFirestore } from "@/firebase/provider"
import { useRouter } from "next/navigation"
import { getOrCreateUser, isUserAChatAgent } from "@/lib/firestore"
import { Loader2, Shield, User, Handshake, MessageSquare } from "lucide-react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    intendedRole: 'user';
}

export function AuthForm({ className, intendedRole, ...props }: AuthFormProps) {
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = React.useState<boolean>(true); // Start loading to handle redirect
  const [showAdminPanelDialog, setShowAdminPanelDialog] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleRedirectResult = async () => {
        if (!auth || !firestore) return;
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                // User has just signed in via redirect.
                const userProfile = await getOrCreateUser(firestore, result.user);
                toast({ title: "Sign in successful!" });
                handleNavigation(userProfile.role);
            }
        } catch (error: any) {
            console.error("Google Redirect Sign-In Error:", error);
            toast({
                variant: "destructive",
                title: "Sign-In Failed",
                description: error.code === 'auth/account-exists-with-different-credential' 
                    ? "An account already exists with the same email address but different sign-in credentials."
                    : error.message || "An unknown error occurred.",
            });
        } finally {
            setIsLoading(false); // Stop loading after processing redirect
        }
    };
    
    handleRedirectResult();
  }, [auth, firestore]);


  const handleAdminNavigation = (path: string) => {
    setShowAdminPanelDialog(false);
    router.push(path);
  }

  const handleNavigation = (role: 'user' | 'partner' | 'admin' | 'agent') => {
    switch (role) {
        case 'admin':
            setShowAdminPanelDialog(true);
            break;
        case 'agent':
            router.push('/agent');
            break;
        case 'partner':
            router.push('/partner');
            break;
        default:
            router.push('/dashboard');
            break;
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    
    const provider = new GoogleAuthProvider();
    // Instead of popup, we use redirect. This is more reliable and avoids popup blockers.
    await signInWithRedirect(auth, provider);
  }
  
  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Button variant="outline" type="button" disabled={isLoading} onClick={handleGoogleSignIn}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12.5C5,8.75 8.36,5.73 12.19,5.73C15.22,5.73 17.02,6.82 17.02,6.82L19.07,4.78C19.07,4.78 16.57,2.5 12.19,2.5C6.42,2.5 2,7.12 2,12.5C2,17.88 6.42,22.5 12.19,22.5C18.1,22.5 22,18.12 22,12.75C22,12.03 21.72,11.53 21.35,11.1Z"
            />
          </svg>
        )}
        Sign In with Google
      </Button>

       <AlertDialog open={showAdminPanelDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Select a Panel</AlertDialogTitle>
                <AlertDialogDescription>
                    You are logged in as an Admin. Choose which panel you want to access.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 pt-4">
                    <Button onClick={() => handleAdminNavigation('/dashboard')} variant="outline" className="w-full h-12 justify-between">
                        View User Panel <User />
                    </Button>
                    <Button onClick={() => handleAdminNavigation('/partner')} variant="outline" className="w-full h-12 justify-between">
                        View Partner Panel <Handshake />
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
