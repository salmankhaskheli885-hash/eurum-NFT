
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
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
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
})

const registerSchema = z.object({
    displayName: z.string().min(1, { message: "Name is required."}),
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    view?: 'login' | 'register'
}

export function AuthForm({ className, view = 'login', ...props }: AuthFormProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [activeTab, setActiveTab] = React.useState(view)

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  })
  
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

  const handleLogin = async (data: LoginFormValues) => {
    if (!auth || !firestore) return
    setIsLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      const userProfile = await getOrCreateUser(firestore, userCredential.user);
      toast({ title: t('login.successTitle') })
      handleNavigation(userProfile.role);
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
  
  const handleRegister = async (data: RegisterFormValues) => {
    if (!auth || !firestore) return
    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const firebaseUser = userCredential.user

      const augmentedUser = {
          ...firebaseUser,
          displayName: data.displayName
      } as any;

      const userProfile = await getOrCreateUser(firestore, augmentedUser, activeTab === 'partner' ? 'partner' : 'user');
      
      toast({ title: t('register.successTitle') })
      handleNavigation(userProfile.role);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const userProfile = await getOrCreateUser(firestore, result.user, activeTab === 'partner' ? 'partner' : 'user');
        toast({ title: t('login.successTitle') });
        handleNavigation(userProfile.role);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('login.signInLink')}</TabsTrigger>
                <TabsTrigger value="register">{t('login.signUpLink')}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                 <div className="grid gap-4 mt-6">
                    <Button variant="outline" type="button" disabled={isLoading} onClick={handleGoogleSignIn}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.4 58.2L354.4 131.1c-15.4-14-34.8-23.2-56.4-23.2-47.2 0-82.8 32.3-97.3 75.8-14.5 43.5-6.9 98.2 25.3 131.2 32.2 33 80.5 33.5 112.5 7.4 9.6-7.8 15.8-19.5 19.5-32.2h-107.5v-62.2h189.4c3.3 18.5 4.6 38.4 4.6 59.8z"></path></svg>}
                        {t('login.googleButton')}
                    </Button>
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
                     <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                        <div className="grid gap-4">
                        <div className="grid gap-1">
                            <Label htmlFor="login-email">
                            {t('login.emailLabel')}
                            </Label>
                            <Input
                            id="login-email"
                            placeholder="name@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            {...loginForm.register("email")}
                            />
                            {loginForm.formState.errors.email && <p className="px-1 text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="login-password">
                            {t('login.passwordLabel')}
                            </Label>
                            <Input
                            id="login-password"
                            placeholder={t('login.passwordLabel')}
                            type="password"
                            disabled={isLoading}
                            {...loginForm.register("password")}
                            />
                            {loginForm.formState.errors.password && <p className="px-1 text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                        </div>
                        <Button disabled={isLoading} className="mt-2">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('login.button')}
                        </Button>
                        </div>
                    </form>
                 </div>
            </TabsContent>
            <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="mt-6">
                    <div className="grid gap-4">
                     <div className="grid gap-1">
                        <Label htmlFor="register-name">
                        {t('register.nameLabel')}
                        </Label>
                        <Input
                        id="register-name"
                        placeholder="John Doe"
                        type="text"
                        disabled={isLoading}
                        {...registerForm.register("displayName")}
                        />
                         {registerForm.formState.errors.displayName && <p className="px-1 text-xs text-destructive">{registerForm.formState.errors.displayName.message}</p>}
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="register-email">
                        {t('register.emailLabel')}
                        </Label>
                        <Input
                        id="register-email"
                        placeholder="name@example.com"
                        type="email"
                        disabled={isLoading}
                        {...registerForm.register("email")}
                        />
                         {registerForm.formState.errors.email && <p className="px-1 text-xs text-destructive">{registerForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="register-password">
                        {t('register.passwordLabel')}
                        </Label>
                        <Input
                        id="register-password"
                        placeholder={t('register.passwordLabel')}
                        type="password"
                        disabled={isLoading}
                        {...registerForm.register("password")}
                        />
                        {registerForm.formState.errors.password && <p className="px-1 text-xs text-destructive">{registerForm.formState.errors.password.message}</p>}
                    </div>
                     <p className="px-1 text-xs text-muted-foreground">{t('register.description')}</p>
                    <Button disabled={isLoading} className="mt-2">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('register.button')}
                    </Button>
                    </div>
                </form>
            </TabsContent>
        </Tabs>
    </div>
  )
}
