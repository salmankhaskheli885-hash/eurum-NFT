
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
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth, useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { UserProfile } from "@/lib/schema";


export default function LoginPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'user' | 'partner'>('user');
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!auth || !firestore) return;

      try {
        const result = await getRedirectResult(auth);
        if (!result) {
          return;
        }

        const user = result.user;
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let finalRedirectPath = '/dashboard';

        if (!userDocSnap.exists()) {
          const role = sessionStorage.getItem('fynix-pro-role') || 'user';
          sessionStorage.removeItem('fynix-pro-role');

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
          toast({ title: 'Sign in successful!' });
          finalRedirectPath = role === 'partner' ? '/partner' : '/dashboard';
        } else {
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
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Sign-In Error',
          description: error.message,
        });
      }
    };

    handleRedirectResult();
  }, [auth, firestore, router, toast]);

  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader className="text-center">
                <Link href="/" className="inline-block mx-auto mb-4">
                    <Logo className="w-16 h-16 text-primary" />
                </Link>
                <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
                <CardDescription>{t("login.description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="user" className="w-full" onValueChange={(value) => setActiveTab(value as 'user' | 'partner')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="user">{t("login.userTab")}</TabsTrigger>
                        <TabsTrigger value="partner">{t("login.partnerTab")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="user">
                        <div className="pt-4">
                          <AuthForm role="user" redirectPath="/dashboard" />
                        </div>
                         <div className="mt-4 text-center text-sm">
                            {t("login.noAccount")}{" "}
                            <Link href="/register" className="underline text-primary">
                            {t("login.signUpLink")}
                            </Link>
                        </div>
                    </TabsContent>
                    <TabsContent value="partner">
                       <div className="pt-4">
                           <AuthForm role="partner" redirectPath="/partner" />
                        </div>
                         <div className="mt-4 text-center text-sm">
                            {t("login.noAccountPartner")}{" "}
                            <Link href="/register" className="underline text-primary">
                            {t("login.signUpLink")}
                            </Link>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  );
}
