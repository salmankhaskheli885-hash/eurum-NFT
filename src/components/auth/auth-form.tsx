
'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

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

  const [email, setEmail] = useState('');
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
      // Handle Registration
      if (!email.endsWith('@fynix.pro')) {
          toast({
              variant: 'destructive',
              title: 'Invalid Email Domain',
              description: 'Only @fynix.pro emails are allowed for registration.',
          });
          setLoading(false);
          return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const authUser = userCredential.user;

        // Send verification email
        await sendEmailVerification(authUser);

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
          title: t('register.successTitle'),
          description: t('register.successDescription'),
        });

        // Redirect to login page after registration
        router.push('/login');

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: error.message,
        });
      }
    } else {
      // Handle Login
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const authUser = userCredential.user;

        if (!authUser.emailVerified) {
            toast({
                variant: 'destructive',
                title: t('login.verification.title'),
                description: t('login.verification.description'),
            });
            setLoading(false);
            return;
        }

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
            throw new Error("User profile not found. Please register first.");
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: error.message,
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
