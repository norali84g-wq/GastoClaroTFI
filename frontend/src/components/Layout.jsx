import { NavLink, Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/constants';
import { useSession } from '../hooks/useSession';
import Button from './ui/Button';
import Logo from './ui/Logo';
import NavIcon from './ui/NavIcon';

const MAIN_CONTENT_ID = 'main-content';

// Grupos del menú. Cada grupo muestra solo los ítems que la persona puede ver (los marcados
// admin son para el administrador).
const NAV_GROUPS = [
  { key: 'general', items: [{ route: 'DASHBOARD', label: 'dashboard', icon: 'home' }] },
  {
    key: 'movements',
    items: [
      { route: 'EXPENSES', label: 'expenses', icon: 'expenses' },
      { route: 'INCOMES', label: 'incomes', icon: 'incomes' },
      { route: 'INSTALLMENTS', label: 'installments', icon: 'installments' },
      { route: 'SHOPPING_LIST', label: 'shoppingList', icon: 'shoppingList' },
    ],
  },
  {
    key: 'planning',
    items: [
      { route: 'SAVINGS', label: 'savings', icon: 'savings' },
      { route: 'SAVINGS_GOALS', label: 'savingsGoals', icon: 'goals' },
      { route: 'STATISTICS', label: 'statistics', icon: 'statistics' },
      { route: 'CATEGORIES', label: 'categories', icon: 'categories', admin: true },
    ],
  },
  { key: 'admin', items: [{ route: 'USERS', label: 'users', icon: 'users', admin: true }] },
];

export default function Layout() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useSession();
  const navigate = useNavigate();

  // logout() borra la sesión local al instante; el aviso al servidor sigue en segundo plano.
  function handleLogout() {
    logout();
    navigate(ROUTES.LOGIN);
  }

  // Con sesión, la navegación es una barra lateral en pantallas anchas y una barra arriba en las
  // angostas; sin sesión, siempre una barra arriba.
  return (
    <>
      <a className="skip-link" href={`#${MAIN_CONTENT_ID}`}>
        {t('nav.skipToContent')}
      </a>
      <div className={isAuthenticated ? 'app-shell app-shell--sidebar' : 'app-shell'}>
        <header className="app-header">
          <Logo tone={isAuthenticated ? 'light' : 'dark'} />
          <nav aria-label={t('nav.label')}>
            {isAuthenticated ? (
              <ul className="app-nav">
                {NAV_GROUPS.map((group) => {
                  const items = group.items.filter((item) => !item.admin || user?.admin);
                  if (items.length === 0) return null;
                  const titleId = `nav-group-${group.key}`;
                  return (
                    <li key={group.key} className="app-nav__section">
                      <p id={titleId} className="app-nav__group">
                        {t(`nav.groups.${group.key}`)}
                      </p>
                      <ul className="app-nav__list" aria-labelledby={titleId}>
                        {items.map((item) => (
                          <li key={item.route}>
                            <NavLink to={ROUTES[item.route]}>
                              <NavIcon name={item.icon} />
                              {t(`nav.${item.label}`)}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
                <li className="app-nav__logout">
                  <Button variant="secondary" onClick={handleLogout}>
                    <NavIcon name="logout" />
                    {t('nav.logout')}
                  </Button>
                </li>
              </ul>
            ) : (
              <ul className="app-nav">
                <li>
                  <NavLink to={ROUTES.LOGIN}>{t('nav.login')}</NavLink>
                </li>
                <li>
                  <NavLink to={ROUTES.REGISTER}>{t('nav.register')}</NavLink>
                </li>
              </ul>
            )}
          </nav>
        </header>
        <main id={MAIN_CONTENT_ID} className="app-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
