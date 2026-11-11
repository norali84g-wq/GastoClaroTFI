import { IconPreferences } from './hooks/icon-preferences.jsx';
import { createRoot } from 'react-dom/client';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { useContext, useEffect, useState } from 'react';
import { AlertHeader } from './components/budget-alerts.jsx';
import { Brand } from './components/brand.jsx';
import { DesktopNavigation, MobileNavigation } from './components/navigation.jsx';
import { DataState } from './components/common.jsx';
import { useData } from './hooks/data.js';
import { AccountContext, api, expireSession, logout, useSession } from './hooks/session.js';
import { AuthPage, Welcome } from './pages/auth.jsx';
import { Budgets } from './pages/budgets.jsx';
import { PaymentMethods } from './pages/payment-methods.jsx';
import { Categories } from './pages/categories.jsx';
import { Incomes } from './pages/incomes.jsx';
import { Dashboard } from './pages/dashboard.jsx';
import { Expenses } from './pages/expenses.jsx';
import { Installments } from './pages/installments.jsx';
import { SavingsGoals } from './pages/savings-goals.jsx';
import { ShoppingList } from './pages/shopping-list.jsx';
import { MonthlyComparison, Statistics } from './pages/reports.jsx';
import { text } from './texts.js';
import './styles.css';
import './gastoclaro-home.css';
import './movements.css';
import './planning.css';
import './part-four.css';

function AppLayout() {
  return (
    <div className="shell">
      <a className="skip" href="#main-content">
        {text.skip}
      </a>
      <aside className="shell-sidebar">
        <Brand to="/inicio" />
        <DesktopNavigation />
        <p className="sidebar-motto">{text.welcomeMotto} ♡</p>
      </aside>
      <main id="main-content" className="content" tabIndex={-1}>
        <AlertHeader>
          <Outlet />
        </AlertHeader>
      </main>
      <MobileNavigation />
    </div>
  );
}

function Profile() {
  const user = useContext(AccountContext);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await logout();
    } catch (error) {
      if (error.status !== 401) window.alert(text.logoutFailed);
    }
  }

  return (
    <>
      <h1>{text.profile}</h1>
      <section className="panel">
        <dl>
          <dt>{text.user}</dt>
          <dd>{user.user}</dd>
          <dt>{text.email}</dt>
          <dd>{user.email ?? text.noEmail}</dd>
        </dl>
        <button type="button" disabled={signingOut} onClick={signOut}>
          {text.logout}
        </button>
      </section>
    </>
  );
}

function VerifySession({ expiresAt }) {
  const result = useData(api.me);
  useEffect(() => {
    const timeout = setTimeout(expireSession, Math.max(0, Date.parse(expiresAt) - Date.now()));
    return () => clearTimeout(timeout);
  }, [expiresAt]);

  if (!result.loading && !result.error) {
    return (
      <AccountContext.Provider value={result.data}>
        <IconPreferences>
          <AppLayout />
        </IconPreferences>
      </AccountContext.Provider>
    );
  }
  return (
    <main className="content">
      <DataState result={result} />
    </main>
  );
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
const expensesRoute = createRoute({
  path: '/consumos',
  component: () => <Expenses search={expensesRoute.useSearch()} />,
  validateSearch: (search) => {
    const result = {};
    if (typeof search.period === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(search.period)) {
      result.period = search.period;
    }
    if (search.new === true) result.new = true;
    else if (Number.isSafeInteger(search.expense) && search.expense > 0)
      result.expense = search.expense;
    return result;
  },
  getParentRoute: () => protectedRoute,
});
const budgetRoute = createRoute({
  path: '/presupuestos',
  getParentRoute: () => protectedRoute,
  validateSearch: (search) =>
    typeof search.period === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(search.period)
      ? { period: search.period }
      : {},
  component: () => {
    const { period } = budgetRoute.useSearch();
    return <Budgets key={period ?? 'current'} initialPeriod={period} />;
  },
});
const newRecordRoute = (path, Page) => {
  const entry = createRoute({
    path,
    getParentRoute: () => protectedRoute,
    validateSearch: (search) => (search.new === true ? { new: true } : {}),
    component: () => {
      const search = entry.useSearch();
      return <Page key={String(Boolean(search.new))} initialEditor={search.new === true} />;
    },
  });
  return entry;
};
const router = createRouter({
  routeTree: root.addChildren([
    route('/', Welcome),
    route('/login', () => <AuthPage key="login" mode="login" />),
    route('/register', () => <AuthPage key="register" mode="register" />),
    protectedRoute.addChildren([
      route('/inicio', Dashboard, protectedRoute),
      expensesRoute,
      newRecordRoute('/ingresos', Incomes),
      route('/categorias', Categories, protectedRoute),
      route('/perfil', Profile, protectedRoute),
      budgetRoute,
      route('/medios-de-pago', PaymentMethods, protectedRoute),
      route('/cuotas', Installments, protectedRoute),
      newRecordRoute('/metas', SavingsGoals),
      route('/lista-de-compras', ShoppingList, protectedRoute),
      route('/comparacion-mensual', MonthlyComparison, protectedRoute),
      route('/estadisticas', Statistics, protectedRoute),
    ]),
  ]),
});

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .catch((error) => console.warn('Service worker:', error));
}
