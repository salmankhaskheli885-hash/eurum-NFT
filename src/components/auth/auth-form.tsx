'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
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
  role: 'user' | 'partner';
  redirectPath: string;
};

function GoogleSignInButton({ role, isRegister }: { role: 'user' | 'partner', isRegister?: boolean }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Firebase not initialized." });
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let finalRedirectPath = '/dashboard';

        if (!userDocSnap.exists()) {
          const shortUid = user.uid.substring(0, 8);
          const userProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: role,
            shortUid,
            balance: 0,
            currency: 'PKR',
            vipLevel: 1,
            vipProgress: 0,
            kycStatus: 'unsubmitted',
            referralLink: `https://fynix.pro/ref/${shortUid}`,
          };
          await setDoc(userDocRef, userProfile);
          toast({ title: isRegister ? 'Registration successful!' : 'Sign in successful!' });
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
            title: 'Google Sign-In Error',
            description: error.message,
        });
    }
  };

  return (
    <Button variant="outline" className="w-full mt-6" onClick={handleGoogleSignIn}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="1em" height="1em" className="mr-2 h-4 w-4">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.698,44,30.342,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        {isRegister ? 'Sign Up with Google' : 'Sign In with Google'}
    </Button>
  );
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
    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "Firebase not initialized." });
      return;
    }
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
    <>
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
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              OR
            </span>
        </div>
      </div>
      <GoogleSignInButton role={role} isRegister={isRegister} />
    </>
  );
}
