
import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // WORKAROUND: Redirecting directly to the dashboard as authentication is mocked.
  redirect('/dashboard');
}
