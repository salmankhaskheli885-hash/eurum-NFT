
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { Logo } from "@/components/icons";
import { AuthForm, handleGoogleSignIn } from "@/components/auth/auth-form";
import { useAuth, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { UserProfile } from "@/lib/schema";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="1em" height="1em" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.698,44,30.342,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

export default function RegisterPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'user' | 'partner'>('user');
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const processRedirectResult = async () => {
        if (!auth || !firestore) return;

        try {
            const result = await getRedirectResult(auth);
            if (result) {
            const user = result.user;
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            let finalRedirectPath = '/dashboard';
            // Retrieve the role from session storage
            const role = sessionStorage.getItem('fynix-pro-role') || 'user';
            sessionStorage.removeItem('fynix-pro-role'); // Clean up

            if (!userDocSnap.exists()) {
                // New user, create profile
                const shortUid = user.uid.substring(0, 8);
                const userProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: role as 'user' | 'partner',
                shortUid,
                balance: 0,
                currency: 'PKR',
                vipLevel: 1,
                vipProgress: 0,
                kycStatus: 'unsubmitted',
                referralLink: `https://fynix.pro/ref/${shortUid}`,
                };
                await setDoc(userDocRef, userProfile);
                toast({ title: 'Registration successful!' });
                finalRedirectPath = role === 'partner' ? '/partner' : '/dashboard';
            } else {
                // Existing user
                const userProfile = userDocSnap.data() as UserProfile;
                toast({ title: 'Sign in successful!' });
                switch (userProfile.role) {
                case 'admin':
                    finalRedirectPath = '/admin';
                    break;
                case 'partner':
                    finalRedirectPath = '/partner';
                    break;
                case 'user':
                default:
                    finalRedirectPath = '/dashboard';
                    break;
                }
            }
            router.push(finalRedirectPath);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Google Sign-In Error',
                description: error.message,
            });
        }
        }
        processRedirectResult();
    }, [auth, firestore, router, toast]);

    const onGoogleSignIn = () => {
      handleGoogleSignIn(auth, activeTab);
    };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <Link href="/" className="inline-block mx-auto mb-4">
                <Logo className="w-16 h-16 text-primary" />
            </Link>
          <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
          <CardDescription>{t('register.description')}</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="user" className="w-full" onValueChange={(value) => setActiveTab(value as 'user' | 'partner')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="user">{t("register.userTab")}</TabsTrigger>
                    <TabsTrigger value="partner">{t("register.partnerTab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="user">
                    <div className="pt-4">
                      <AuthForm isRegister role="user" redirectPath="/dashboard" />
                    </div>
                     <div className="mt-4 text-center text-sm">
                        {t('register.hasAccount')}{" "}
                        <Link href="/login" className="underline text-primary">
                        {t('register.signInLink')}
                        </Link>
                    </div>
                </TabsContent>
                <TabsContent value="partner">
                    <div className="pt-4">
                        <AuthForm isRegister role="partner" redirectPath="/partner" />
                    </div>
                     <div className="mt-4 text-center text-sm">
                        {t('register.hasAccountPartner')}{" "}
                        <Link href="/login" className="underline text-primary">
                        {t('register.signInLink')}
                        </Link>
                    </div>
                </TabsContent>
            </Tabs>
             <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    {t('register.separator')}
                    </span>
                </div>
            </div>
            <Button variant="outline" className="w-full mt-6" onClick={onGoogleSignIn}>
                <GoogleIcon className="mr-2 h-4 w-4"/>
                {t('register.googleButton')}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
