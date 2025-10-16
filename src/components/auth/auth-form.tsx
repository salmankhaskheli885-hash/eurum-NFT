
"use client"

import * as React from "react"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
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
import Link from "next/link"


interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    intendedRole: 'user' | 'admin' | 'agent';
}

export function AuthForm({ className, intendedRole, ...props }: AuthFormProps) {
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [showAdminPanelDialog, setShowAdminPanelDialog] = React.useState<boolean>(false);


  const handleNavigation = (role: 'user' | 'partner' | 'admin' | 'agent') => {
    switch (role) {
        case 'admin':
            // For admins, we now show a dialog instead of redirecting directly.
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
    if (!auth || !firestore) return;
    setIsLoading(true);
    
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const userProfile = await getOrCreateUser(firestore, result.user);
      
      // Role-based access control
      if (intendedRole === 'admin' && userProfile.role !== 'admin') {
        throw new Error("You do not have admin privileges.");
      }
      
      if (intendedRole === 'agent') {
        const isAgent = await isUserAChatAgent(firestore, userProfile.email!);
        if (!isAgent) {
            throw new Error("You are not registered as a chat agent.");
        }
      }

      toast({ title: "Sign in successful!" });
      // This will now handle showing the dialog for admins
      handleNavigation(userProfile.role);

    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      // Log user out if role check fails
      await auth.signOut();
      toast({
        variant: "destructive",
        title: "Sign-In Failed",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      // We keep loading true for admins until they select a panel
      if (intendedRole !== 'admin') {
          setIsLoading(false);
      }
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
            <AlertDialogTitle>Select a Panel</AlertDialogTitle>
            <AlertDialogDescription>
                You are logged in as an Admin. Choose which panel you want to access.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 pt-4">
                <Link href="/admin">
                    <Button className="w-full h-14 text-lg justify-between" size="lg">
                        Go to Admin Panel
                        <Shield className="h-6 w-6" />
                    </Button>
                </Link>
                <Link href="/dashboard" target="_blank">
                    <Button variant="outline" className="w-full h-12 justify-between">
                        View User Panel
                        <User className="h-5 w-5" />
                    </Button>
                </Link>
                <Link href="/partner" target="_blank">
                    <Button variant="outline" className="w-full h-12 justify-between">
                        View Partner Panel
                        <Handshake className="h-5 w-5" />
                    </Button>
                </Link>
                <Link href="/agent" target="_blank">
                    <Button variant="outline" className="w-full h-12 justify-between">
                        View Agent Panel
                        <MessageSquare className="h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
