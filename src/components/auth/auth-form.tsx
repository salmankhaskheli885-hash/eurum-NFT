
"use client"

import * as React from "react"
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth"

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

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}


export function AuthForm({ className, view, ...props }: AuthFormProps) {
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [isOtpSent, setIsOtpSent] = React.useState(false);

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

  const setupRecaptcha = () => {
    if (!auth) return;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
        }
      });
    }
  }

  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore || !phoneNumber) return;
    setIsLoading(true);
    setupRecaptcha();

    const appVerifier = window.recaptchaVerifier!;
    // Format phone number to E.164
    const formattedPhoneNumber = `+${phoneNumber.replace(/\D/g, '')}`;

    try {
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        setIsOtpSent(true);
        toast({ title: "OTP Sent!", description: `An OTP has been sent to ${formattedPhoneNumber}` });
    } catch (error: any) {
        console.error("SMS not sent error", error);
        toast({
            variant: "destructive",
            title: "Failed to send OTP",
            description: error.message,
        });
        window.recaptchaVerifier?.render().then((widgetId) => {
            if(window.grecaptcha){
                 window.grecaptcha.reset(widgetId);
            }
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !window.confirmationResult || !firestore) return;
    setIsLoading(true);

    try {
        const result = await window.confirmationResult.confirm(otp);
        const userProfile = await getOrCreateUser(firestore, result.user, 'user', `User ${result.user.uid.substring(0,5)}`);
        toast({ title: "Sign in successful!" });
        handleNavigation(userProfile.role);

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Sign-In Failed",
            description: "The OTP is incorrect or has expired.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {!isOtpSent ? (
        <form onSubmit={onSendOtp}>
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="923001234567"
                type="tel"
                autoComplete="tel"
                disabled={isLoading}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={onVerifyOtp}>
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                placeholder="123456"
                type="text"
                autoComplete="one-time-code"
                disabled={isLoading}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <Button disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP & Login
            </Button>
             <Button variant="link" size="sm" onClick={() => setIsOtpSent(false)} disabled={isLoading}>
                Back to phone number
            </Button>
          </div>
        </form>
      )}
      <div id="recaptcha-container"></div>
    </div>
  )
}

    