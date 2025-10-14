import { redirect } from 'next/navigation';

export default function Home() {
  // In a real app, this would involve checking authentication status.
  // For this scaffold, we'll redirect directly to the dashboard.
  redirect('/dashboard');
}
