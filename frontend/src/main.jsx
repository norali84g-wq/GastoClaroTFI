import { createRoot } from 'react-dom/client';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { DataState } from './components/common.jsx';
import { useData } from './hooks/data.js';
import { api, expireSession, logout, useSession } from './hooks/session.js';
import { AuthPage, Welcome } from './pages/auth.jsx';
import { Budgets } from './pages/budgets.jsx';
import { PaymentMethods } from './pages/payment-methods.jsx';
import { Dashboard } from './pages/dashboard.jsx';
import { Expenses } from './pages/expenses.jsx';
import { Installments } from './pages/installments.jsx';
import { text } from './texts.js';
import './styles.css';

function AppLayout() {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await logout();
    } catch (error) {
      if (error.status !== 401) window.alert(text.logoutFailed);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="shell">
      <a className="skip" href="#main-content">
        {text.skip}
      </a>
      <aside>
        <Link className="brand" to="/inicio" onClick={() => setOpen(false)}>
          {text.brand}
        </Link>
        <button
          className="menu-toggle secondary"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="navigation"
        >
          {text.menu}
        </button>
        <nav id="navigation" className={open ? 'open' : ''}>
          <Link to="/inicio" onClick={() => setOpen(false)}>
            {text.home}
          </Link>
          <Link to="/consumos" onClick={() => setOpen(false)}>
            {text.expenses}
          </Link>
          <Link to="/presupuestos" onClick={() => setOpen(false)}>
            {text.budgets}
          </Link>
          <Link to="/medios-de-pago" onClick={() => setOpen(false)}>
            {text.paymentMethods}
          </Link>
          <Link to="/cuotas" onClick={() => setOpen(false)}>
            {text.installments}
          </Link>
          <button type="button" className="secondary" disabled={signingOut} onClick={signOut}>
            {text.logout}
          </button>
        </nav>
      </aside>
      <main id="main-content" className="content">
        <Outlet />
      </main>
    </div>
  );
}

function VerifySession({ expiresAt }) {
  const result = useData(api.me);
  useEffect(() => {
    const timeout = setTimeout(expireSession, Math.max(0, Date.parse(expiresAt) - Date.now()));
    return () => clearTimeout(timeout);
  }, [expiresAt]);

  return <DataState result={result}>{() => <AppLayout />}</DataState>;
}

function Protected() {
  const session = useSession();
  if (!session) return <Navigate to="/login" replace />;
  return <VerifySession key={session.token} expiresAt={session.expires_at} />;
}

const root = createRootRoute({
  component: Outlet,
  notFoundComponent: () => <Navigate to="/" replace />,
});
const route = (path, component, parent = root) =>
  createRoute({ path, component, getParentRoute: () => parent });
const protectedRoute = createRoute({
  id: 'protected',
  component: Protected,
  getParentRoute: () => root,
});
const router = createRouter({
  routeTree: root.addChildren([
    route('/', Welcome),
    route('/login', () => <AuthPage mode="login" />),
    route('/register', () => <AuthPage mode="register" />),
    protectedRoute.addChildren([
      route('/inicio', Dashboard, protectedRoute),
      route('/consumos', Expenses, protectedRoute),
      route('/presupuestos', Budgets, protectedRoute),
      route('/medios-de-pago', PaymentMethods, protectedRoute),
      route('/cuotas', Installments, protectedRoute),
    ]),
  ]),
});

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .catch((error) => console.warn('Service worker:', error));
}
