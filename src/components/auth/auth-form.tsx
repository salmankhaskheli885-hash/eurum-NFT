
"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useFirestore } from "@/firebase/provider"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/use-translation"
import { getOrCreateUser } from "@/lib/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type UserFormValues = z.infer<typeof loginSchema>

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    // No role prop needed, will be handled by tabs
}

export function AuthForm({ className, ...props }: AuthFormProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [activeTab, setActiveTab] = React.useState<'user' | 'partner' | 'agent'>("user")
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const handleLogin = async (data: UserFormValues) => {
    if (!auth) return
    setIsLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      if (userCredential.user) {
        toast({ title: t('login.successTitle') })
        
        // Redirect based on the role selected in the tab
        if (activeTab === 'admin') router.push("/admin");
        else if (activeTab === 'partner') router.push("/partner");
        else router.push("/dashboard");

      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return
    setIsLoading(true)
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      // This is crucial. It ensures the user document exists in Firestore
      // with the correct role before we redirect.
      const userProfile = await getOrCreateUser(firestore, firebaseUser, activeTab);

      toast({ title: t('login.successTitle') })
      
      // Redirect logic
      if (userProfile.role === 'admin') router.push('/admin');
      else if (userProfile.role === 'partner') router.push('/partner');
      else if (userProfile.role === 'agent') router.push('/agent');
      else router.push('/dashboard');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="user">{t('login.userTab')}</TabsTrigger>
                <TabsTrigger value="partner">{t('login.partnerTab')}</TabsTrigger>
                <TabsTrigger value="agent">{t('login.agentTab')}</TabsTrigger>
            </TabsList>
            <TabsContent value="user" />
            <TabsContent value="partner" />
            <TabsContent value="agent" />
        </Tabs>

      <form onSubmit={handleSubmit(handleLogin)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              {t('login.emailLabel')}
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && <p className="px-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              {t('login.passwordLabel')}
            </Label>
            <Input
              id="password"
              placeholder={t('login.passwordLabel')}
              type="password"
              disabled={isLoading}
              {...register("password")}
            />
             {errors.password && <p className="px-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('login.button')}
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('login.separator')}
          </span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={isLoading} onClick={handleGoogleSignIn}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          // Using a simple SVG for Google icon to avoid extra dependencies
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 106.5 280.1 96 248 96c-84.3 0-152.3 67.8-152.3 152s68 152 152.3 152c92.8 0 134.4-65.4 140.8-99.9h-141v-70h242.3c1.3 12.2 2.6 24.5 2.6 37.4z"></path></svg>
        )}
        {t('login.googleButton')}
      </BODYA>
      <p className="px-8 text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{" "}
        <a href="/register" className="underline underline-offset-4 hover:text-primary">
          {t('login.signUpLink')}
        </a>
      </p>
    </div>
  )
}
