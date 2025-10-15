
import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Redirect all registration attempts to the login page for a unified auth flow.
  redirect('/login');
}
