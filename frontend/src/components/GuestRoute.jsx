import { Navigate, Outlet, useLocation } from 'react-router';
import { ROUTES } from '../config/constants';
import { useSession } from '../hooks/useSession';
import LoadingIndicator from './ui/LoadingIndicator';

// Rutas solo para quien no tiene sesión (login y registro). Con sesión, vuelve a la ruta de
// origen que guardó ProtectedRoute o, si no hay, al dashboard. Así se resuelve también la
// redirección después de un login o registro exitoso.
export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <LoadingIndicator />;
  if (isAuthenticated) {
    return <Navigate to={location.state?.from ?? ROUTES.DASHBOARD} replace />;
  }
  return <Outlet />;
}
