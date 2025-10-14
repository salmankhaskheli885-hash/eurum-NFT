
'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/schema';
import { useTranslation } from '@/hooks/use-translation';

type AuthFormProps = {
  role: 'user' | 'partner';
  isRegister?: boolean;
};

export function AuthForm({ role, isRegister = false }: AuthFormProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [email, setEmail] = useState('yourname@fynix.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Firebase not initialized.',
      });
      return;
    }
    setLoading(true);

    if (isRegister) {
      // --- Handle Registration ---
      let authUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        authUser = userCredential.user;

        const shortUid = authUser.uid.substring(0, 8);
        const newUserProfile: UserProfile = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: name,
          role,
          shortUid,
          balance: 0,
          currency: 'PKR',
          vipLevel: 1,
          vipProgress: 0,
          kycStatus: 'unsubmitted',
          referralLink: `https://fynix.pro/ref/${shortUid}`,
        };

        await setDoc(doc(firestore, 'users', authUser.uid), newUserProfile);
        
        toast({
            title: "Registration Successful!",
            description: "You can now log in with your credentials.",
        });

        router.push('/login');

      } catch (error: any) {
        // If firestore writing fails, delete the created auth user
        if (authUser) {
          await deleteUser(authUser).catch((deleteErr) => {
            console.error("Failed to delete orphaned auth user:", deleteErr);
            // This is a critical error, the user exists in Auth but not in Firestore
             toast({
                variant: 'destructive',
                title: 'Critical Registration Failed',
                description: `User created in Auth but profile failed to save. Please contact support. Error: ${error.message}`,
             });
          });
        }
        
        let errorMessage = error.message;
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please log in.';
            }
        }

        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: errorMessage,
        });
      }
    } else {
      // --- Handle Login ---
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const authUser = userCredential.user;

        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userProfile = userDocSnap.data() as UserProfile;
          toast({ title: t('login.successTitle') });

          switch (userProfile.role) {
            case 'admin':
              router.push('/admin');
              break;
            case 'partner':
              router.push('/partner');
              break;
            case 'user':
            default:
              router.push('/dashboard');
              break;
          }
        } else {
          throw new Error('User profile not found. Please contact support.');
        }
      } catch (error: any) {
         let errorMessage = error.message;
          if (error instanceof FirebaseError) {
             if (error.code === 'auth/invalid-credential') {
                errorMessage = "Invalid email or password. Please try again.";
             }
          }
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: errorMessage,
        });
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleAuthAction} className="space-y-4">
      {isRegister && (
        <div className="space-y-2">
          <Label htmlFor="name">{t('register.nameLabel')}</Label>
          <Input
            id="name"
            type="text"
            placeholder="Satoshi Nakamoto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">{t('login.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          placeholder="satoshi@fynix.pro"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('login.passwordLabel')}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={6}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? t('login.processing')
          : isRegister
          ? t('register.button')
          : t('login.button')}
      </Button>
    </form>
  );
}
