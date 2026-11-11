import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { currentPeriod, DataState, formatMoney } from './common.jsx';
import { Chanchito, Status } from './chanchito.jsx';
import { Icon } from './brand.jsx';
import { useData } from '../hooks/data.js';
import { AccountContext, api } from '../hooks/session.js';
import { text } from '../texts.js';

const AlertsContext = createContext(null);
const tones = {
  80: ['preocupado', 'yellow', text.alertAt80],
  90: ['sorprendido', 'orange', text.alertAt90],
  100: ['triste', 'red', text.alertAt100],
};

export function BudgetAlert({ alert }) {
  const { threshold_percentage: threshold, budget, financial_tip: tip } = alert;
  const [pose, tone, message] = tones[threshold] ?? [
    'preocupado',
    'yellow',
    (name) => text.alertAt(threshold, name),
  ];
  return (
    <article className={`gc-alert gc-alert-${tone}`}>
      <Chanchito pose={pose} size={66} />
      <div>
        <strong>{message(budget.category.name)}</strong>
        <small>{formatMoney(budget.amount)}</small>
        {tip?.content && (
          <p>
            <strong>{text.dashboardTip}</strong> · {tip.content}
          </p>
        )}
      </div>
    </article>
  );
}

export function BudgetAlertList({ result }) {
  return (
    <DataState result={result}>
      {(items) =>
        items.length ? (
          <ul className="records gc-alert-list">
            {items.map((alert) => (
              <li key={alert.id}>
                <BudgetAlert alert={alert} />
              </li>
            ))}
          </ul>
        ) : (
          <Status message={text.noAlerts} />
        )
      }
    </DataState>
  );
}

export function useMonthAlerts(period) {
  const current = useContext(AlertsContext);
  const load = useCallback(
    (signal) =>
      period === current.period ? Promise.resolve([]) : api.budgetAlerts(period, signal),
    [period, current.period],
  );
  const history = useData(load);
  return period === current.period ? current.result : history;
}

export function AlertHeader({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation({ select: (value) => value.href });
  const period = currentPeriod();
  const load = useCallback((signal) => api.budgetAlerts(period, signal), [period, location]);
  const result = useData(load);
  const count = result.data?.length ?? 0;
  const { user } = useContext(AccountContext);
  const initial = Array.from(user.trim())[0]?.toLocaleUpperCase('es-AR') ?? '';
  useEffect(() => setOpen(false), [location]);

  return (
    <AlertsContext.Provider value={{ period, result }}>
      <div
        className="gc-app-header"
        onKeyDown={(event) => {
          if (open && event.key === 'Escape') {
            setOpen(false);
            event.currentTarget.querySelector('button')?.focus();
          }
        }}
      >
        <button
          type="button"
          className="secondary gc-bell"
          aria-label={text.bellAlerts(count)}
          aria-expanded={open}
          aria-controls={open ? 'gc-bell-menu' : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name="bell" />
          <span aria-hidden="true">{count}</span>
        </button>
        <Link className="gc-header-profile" to="/perfil" aria-label={text.profile}>
          <span aria-hidden="true">{initial}</span>
          <strong>{user}</strong>
        </Link>
        {open && (
          <section id="gc-bell-menu" className="panel gc-bell-menu">
            <h2>{text.alerts}</h2>
            <BudgetAlertList result={result} />
          </section>
        )}
      </div>
      {children}
    </AlertsContext.Provider>
  );
}
