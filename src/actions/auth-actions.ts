'use server';

import { signInWithGoogle } from "@/firebase/server-auth";
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function googleSignInAction() {
    const referer = headers().get('referer');
    await signInWithGoogle(referer || '/');
}
