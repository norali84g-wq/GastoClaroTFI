import { Navigate, Route, Routes } from 'react-router';
import { ROUTES } from './config/constants';
import GuestRoute from './components/GuestRoute';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import UsersPage from './pages/UsersPage';
import SavingsPage from './pages/SavingsPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import ShoppingListPage from './pages/ShoppingListPage';
import StatisticsPage from './pages/StatisticsPage';
import DashboardPage from './pages/DashboardPage';
import IncomesPage from './pages/IncomesPage';
import InstallmentsPage from './pages/InstallmentsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Rutas públicas: con sesión redirigen adentro */}
        <Route element={<GuestRoute />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        {/* Rutas protegidas: sin sesión redirigen al login */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.SAVINGS} element={<SavingsPage />} />
          <Route path={ROUTES.SAVINGS_GOALS} element={<SavingsGoalsPage />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.EXPENSES} element={<DashboardPage expensesOnly />} />
          <Route path={ROUTES.INCOMES} element={<IncomesPage />} />
          <Route path={ROUTES.INSTALLMENTS} element={<InstallmentsPage />} />
          <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTES.USERS} element={<UsersPage />} />
          <Route path={ROUTES.SHOPPING_LIST} element={<ShoppingListPage />} />
          <Route path={ROUTES.STATISTICS} element={<StatisticsPage />} />
          <Route path={ROUTES.CATEGORY_DETAIL} element={<CategoryDetailPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
