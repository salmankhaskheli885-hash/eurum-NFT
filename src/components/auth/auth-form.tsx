
"use client"

import * as React from "react"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth, useFirestore } from "@/firebase/provider"
import { useRouter } from "next/navigation"
import { getOrCreateUser } from "@/lib/firestore"
import { Loader2, Shield, User, Handshake, MessageSquare } from "lucide-react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { UserProfile } from "@/lib/schema"

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    intendedRole: 'user' | 'partner';
}

export function AuthForm({ className, intendedRole, ...props }: AuthFormProps) {
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [showAdminPanelDialog, setShowAdminPanelDialog] = React.useState<boolean>(false);

  // This effect will just handle the initial loading state
  React.useEffect(() => {
    setIsLoading(false)
  }, []);


  const handleAdminNavigation = (path: string) => {
    setShowAdminPanelDialog(false);
    router.push(path);
  }

  const handleNavigation = (user: UserProfile) => {
    switch (user.role) {
        case 'agent':
            router.push('/agent');
            break;
        case 'partner':
            router.push('/partner');
            break;
        case 'user':
        default:
            router.push('/dashboard');
            break;
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        if (result) {
            const userProfile = await getOrCreateUser(firestore, result.user);
            toast({ title: "Sign in successful!" });
            
            if (userProfile.role === 'admin') {
                setShowAdminPanelDialog(true);
            } else {
                handleNavigation(userProfile);
            }
        }
    } catch (error: any) {
        console.error("Google Popup Sign-In Error:", error);
        toast({
            variant: "destructive",
            title: "Sign-In Failed",
            description: error.code === 'auth/popup-closed-by-user'
                ? "The sign-in window was closed before completion."
                : error.code === 'auth/account-exists-with-different-credential' 
                ? "An account already exists with the same email address but different sign-in credentials."
                : error.message || "An unknown error occurred.",
        });
    } finally {
        setIsLoading(false);
    }
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
                    <AlertDialogTitle>Admin Access Detected</AlertDialogTitle>
                    <AlertDialogDescription>
                        Choose which panel you want to visit.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 pt-4">
                     <Button onClick={() => handleAdminNavigation('/admin')} className="w-full h-14 text-lg justify-between">
                        Go to Admin Panel
                        <Shield className="h-6 w-6" />
                    </Button>
                    <Button onClick={() => handleAdminNavigation('/dashboard')} variant="outline" className="w-full h-12 justify-between">
                        View User Panel <User />
                    </Button>
                    <Button onClick={() => handleAdminNavigation('/partner')} variant="outline" className="w-full h-12 justify-between">
                        View Partner Panel <Handshake />
                    </Button>
                    <Button onClick={() => handleAdminNavigation('/agent')} variant="outline" className="w-full h-12 justify-between">
                        View Agent Panel <MessageSquare />
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
