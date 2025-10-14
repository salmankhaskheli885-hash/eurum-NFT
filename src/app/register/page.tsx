
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-[350px] flex-col justify-center space-y-6 text-center">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Registration is handled through Google Sign-In.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
            Please proceed to the login page to sign up or sign in using your Google account.
        </p>
        <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Go to Login Page
        </Link>
      </div>
    </div>
  );
}
