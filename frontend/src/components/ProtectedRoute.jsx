import { Navigate, Outlet, useLocation } from 'react-router';
import { ROUTES } from '../config/constants';
import { useSession } from '../hooks/useSession';
import LoadingIndicator from './ui/LoadingIndicator';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <LoadingIndicator />;
  if (!isAuthenticated) {
    // Guardamos el destino para volver ahí después de iniciar sesión.
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }
  return <Outlet />;
}
