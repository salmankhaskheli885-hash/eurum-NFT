
"use client"

import * as React from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useFirestore } from "@/firebase/provider"
import { useRouter } from "next/navigation"
import { getOrCreateUser } from "@/lib/firestore"
import { Loader2 } from "lucide-react"

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    view: 'login' | 'register'
}

export function AuthForm({ className, view, ...props }: AuthFormProps) {
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userProfile = await getOrCreateUser(firestore, result.user);
        toast({ title: "Sign in successful!" });
        handleNavigation(userProfile.role);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Sign-In Failed",
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // We pass the name from the form to create the user profile
        const userProfile = await getOrCreateUser(firestore, result.user, 'user', name);
        toast({ title: "Registration successful!" });
        handleNavigation(userProfile.role);
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleSubmit = view === 'login' ? handleLogin : handleRegister;

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          {view === 'register' && (
            <div className="grid gap-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    placeholder="John Doe"
                    type="text"
                    autoCapitalize="words"
                    autoComplete="name"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
          )}
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoComplete={view === 'login' ? 'current-password' : 'new-password'}
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {view === 'login' ? 'Sign In' : 'Sign Up'}
          </Button>
        </div>
      </form>
    </div>
  )
}
