

import { Navigate } from 'react-router-dom';

export default function Home() {
  // Redirect to the login page instead of the dashboard.
  return <Navigate to="/login" />;
}
