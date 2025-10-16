
"use client"

import * as React from "react"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useFirestore } from "@/firebase/provider"
import { useRouter } from "next/navigation"
import { getOrCreateUser } from "@/lib/firestore"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    view?: 'login' | 'register'
}

export function AuthForm({ className, ...props }: AuthFormProps) {
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [selectedRole, setSelectedRole] = React.useState<'user' | 'partner'>('user')

  const handleNavigation = (role: 'user' | 'partner' | 'admin' | 'agent') => {
    switch (role) {
        case 'admin':
            router.push('/admin');
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
    if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "Firebase not initialized",
            description: "Please wait a moment and try again.",
        });
        return;
    };
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const userProfile = await getOrCreateUser(firestore, result.user, selectedRole);
        toast({ title: "Sign in successful!" });
        handleNavigation(userProfile.role);
    } catch (error: any) {
        // This is the most common error, so we give a specific message for it.
        if (error.code === 'auth/unauthorized-domain') {
             toast({
                variant: "destructive",
                title: "Domain Not Authorized",
                description: "This domain is not authorized for Google Sign-in. Please contact support.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Google Sign-In Failed",
                description: error.message,
            });
        }
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
        <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user">User</TabsTrigger>
                <TabsTrigger value="partner">Partner</TabsTrigger>
            </TabsList>
        </Tabs>

        <Button variant="outline" type="button" disabled={isLoading} onClick={handleGoogleSignIn}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.4 58.2L354.4 131.1c-15.4-14-34.8-23.2-56.4-23.2-47.2 0-82.8 32.3-97.3 75.8-14.5 43.5-6.9 98.2 25.3 131.2 32.2 33 80.5 33.5 112.5 7.4 9.6-7.8 15.8-19.5 19.5-32.2h-107.5v-62.2h189.4c3.3 18.5 4.6 38.4 4.6 59.8z"></path></svg>}
            Sign In with Google
        </Button>
    </div>
  )
}
