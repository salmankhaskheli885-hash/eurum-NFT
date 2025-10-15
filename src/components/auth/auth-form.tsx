
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
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

  const handleLogin = async (data: LoginFormValues) => {
    if (!auth) return
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      toast({ title: t('login.successTitle') })
      router.push("/dashboard")
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

      // We need to pass the displayName to getOrCreateUser
      // To do this, we'll augment the FirebaseUser object before passing it
      const augmentedUser = {
          ...firebaseUser,
          displayName: data.displayName
      } as any;


      await getOrCreateUser(firestore, augmentedUser)
      
      toast({ title: t('register.successTitle') })
      router.push("/dashboard")

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


  return (
    <div className={cn("grid gap-6", className)} {...props}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('login.signInLink')}</TabsTrigger>
                <TabsTrigger value="register">{t('login.signUpLink')}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                 <form onSubmit={loginForm.handleSubmit(handleLogin)} className="mt-6">
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
