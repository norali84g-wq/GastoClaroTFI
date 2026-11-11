import { useContext, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Icon } from './brand.jsx';
import { AccountContext } from '../hooks/session.js';
import { text } from '../texts.js';

const home = { label: text.home, icon: 'home', to: '/inicio' };
const expenses = { label: text.expenses, icon: 'cart', to: '/consumos' };
const goals = { label: text.savingsGoals, icon: 'goal', to: '/metas' };
const profile = { label: text.profile, icon: 'settings', to: '/perfil' };
const adminItems = [
  { label: text.administration, icon: 'settings', to: '/administracion' },
  { label: text.categories, icon: 'list', to: '/categorias' },
];
const groups = [
  [text.financeGroup, [{ label: text.incomes, icon: 'wallet', to: '/ingresos' }, expenses, goals]],
  [
    text.managementGroup,
    [
      { label: text.paymentAndInstallments, icon: 'card', to: '/medios-de-pago' },
      { label: text.budgets, icon: 'calendar', to: '/presupuestos' },
      { label: text.shoppingList, icon: 'cart', to: '/lista-de-compras' },
    ],
  ],
  [
    text.reportsGroup,
    [
      { label: text.monthlyComparison, icon: 'chart', to: '/comparacion-mensual' },
      { label: text.statistics, icon: 'pie', to: '/estadisticas' },
    ],
  ],
];

function NavItem({ item, onClick }) {
  const label = (
    <>
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </>
  );
  return (
    <Link to={item.to} search={item === expenses ? {} : undefined} onClick={onClick}>
      {label}
    </Link>
  );
}

export function DesktopNavigation() {
  const { admin } = useContext(AccountContext);
  return (
    <nav className="desktop-navigation" aria-label={text.menu}>
      <NavItem item={home} />
      {groups.map(([title, items]) => (
        <div className="nav-group" key={title}>
          <p>{title}</p>
          {items.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </div>
      ))}
      {admin && adminItems.map((item) => <NavItem key={item.to} item={item} />)}
      <NavItem item={profile} />
    </nav>
  );
}

function MobileNavigationBar() {
  const { admin } = useContext(AccountContext);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <nav
      className="mobile-navigation"
      aria-label={text.mobileMenu}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          close();
          document.getElementById('mobile-more-button')?.focus();
        }
      }}
    >
      <div className="mobile-tabs">
        <NavItem item={home} onClick={close} />
        <NavItem item={expenses} onClick={close} />
        <Link
          className="mobile-add"
          to="/consumos"
          search={{ new: true }}
          aria-label={text.newExpense}
          activeOptions={{ includeSearch: true, exact: true }}
          onClick={close}
        >
          <Icon name="plus" />
        </Link>
        <NavItem item={{ ...goals, label: text.goals }} />
        <button
          id="mobile-more-button"
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={open ? 'mobile-more' : undefined}
        >
          <Icon name="more" />
          <span>{text.more}</span>
        </button>
      </div>
      {open && (
        <div className="mobile-more" id="mobile-more">
          {groups
            .flatMap(([, items]) => items)
            .filter((item) => item !== expenses && item !== goals)
            .map((item) => (
              <NavItem key={item.label} item={item} onClick={close} />
            ))}
          {admin && adminItems.map((item) => <NavItem key={item.to} item={item} onClick={close} />)}
          <NavItem item={profile} onClick={close} />
        </div>
      )}
    </nav>
  );
}

export function MobileNavigation() {
  const location = useLocation();
  return <MobileNavigationBar key={location.href} />;
}
