
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/schema';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

type AuthFormProps = {
  isRegister?: boolean;
  role: 'user' | 'partner'; // Admin role is not for public registration
  redirectPath: string;
};

export async function handleGoogleSignIn(auth: any, firestore: any, role: 'user' | 'partner', toast: any, router: any) {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    let finalRedirectPath = '/dashboard';

    if (!userDocSnap.exists()) {
      // New user, create profile
      const shortUid = user.uid.substring(0, 8);
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role,
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
           finalRedirect_path = '/dashboard';
           break;
       }
    }
    router.push(finalRedirectPath);
  } catch (error: any) {
    toast({
      variant: 'destructive',
      title: 'Google Sign-In Error',
      description: error.message,
    });
  }
}

export function AuthForm({
  isRegister = false,
  role,
  redirectPath,
}: AuthFormProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;
        const shortUid = user.uid.substring(0, 8);

        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: values.displayName || user.displayName,
          role,
          shortUid,
          balance: 0,
          currency: 'PKR',
          vipLevel: 1,
          vipProgress: 0,
          kycStatus: 'unsubmitted',
          referralLink: `https://fynix.pro/ref/${shortUid}`,
        };

        await setDoc(doc(firestore, 'users', user.uid), userProfile);
        toast({ title: 'Registration successful!' });
        router.push(redirectPath);
      } else {
        // Sign In Logic
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;

        // Fetch user profile to check their role
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userProfile = userDocSnap.data() as UserProfile;
          toast({ title: 'Sign in successful!' });

          // Redirect based on role
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
          // Fallback if profile doesn't exist, though it should
          toast({ title: 'Sign in successful!' });
          router.push('/dashboard'); 
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isRegister && (
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Satoshi Nakamoto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="m@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {isRegister ? 'Sign Up' : 'Sign In'}
        </Button>
      </form>
    </Form>
  );
}
