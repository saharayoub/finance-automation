import { Navigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
