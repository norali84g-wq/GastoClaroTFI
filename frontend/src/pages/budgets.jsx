import { Link } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import {
  CategoryField,
  currentPeriod,
  DataState,
  Field,
  FormError,
  formatMoney,
} from '../components/common.jsx';
import { useAction, useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

function BudgetList({ items }) {
  if (!items.length) return <p>{text.empty}</p>;
  return (
    <ul className="records">
      {items.map((item) => (
        <li className="panel" key={item.id}>
          <h3>{item.category.name}</h3>
          <p>
            {text.spent}: {formatMoney(item.spent)} / {formatMoney(item.amount)}
          </p>
          <p>
            {text.available}: {formatMoney(item.remaining)} · {item.percentage}%
          </p>
          <progress
            aria-label={item.category.name}
            value={Math.max(0, Math.min(item.percentage, 100))}
            max="100"
          />
        </li>
      ))}
    </ul>
  );
}

function useBudgets(period) {
  const load = useCallback((signal) => api.budgets(period, signal), [period]);
  return useData(load);
}

export function BudgetSummary({ period }) {
  const result = useBudgets(period);
  return (
    <section className="panel dashboard-budgets">
      <h2>{text.budgets}</h2>
      <DataState result={result}>
        {(items) => (items.length ? <BudgetList items={items} /> : <p>{text.noMonthlyBudgets}</p>)}
      </DataState>
      <Link className="button secondary" to="/presupuestos">
        {text.viewBudgets}
      </Link>
    </section>
  );
}

function BudgetForm({ categories, period, onSaved }) {
  const { busy, error, run } = useAction();

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    run(async () => {
      await api.createBudget({
        period,
        category_id: Number(values.category_id),
        amount: Number(values.amount),
      });
      onSaved();
    });
  }

  return (
    <form onSubmit={submit}>
      <CategoryField categories={categories} error={error} />
      <Field
        label={text.amount}
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        error={error}
        required
      />
      <FormError error={error} />
      <button disabled={busy || !categories.length}>{busy ? text.saving : text.save}</button>
    </form>
  );
}

export function Budgets() {
  const [period, setPeriod] = useState(currentPeriod);
  const [showForm, setShowForm] = useState(false);
  const loadAlerts = useCallback((signal) => api.budgetAlerts(period, signal), [period]);
  const result = useBudgets(period);
  const alerts = useData(loadAlerts);
  const categories = useData(api.categories);

  return (
    <>
      <h1>{text.budgets}</h1>
      <div className="toolbar">
        <Field
          label={text.period}
          type="month"
          value={period}
          onChange={(event) => setPeriod(event.target.value || currentPeriod())}
        />
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? text.cancel : text.newBudget}
        </button>
      </div>
      {showForm && (
        <section className="panel">
          <h2>{text.newBudget}</h2>
          <DataState result={categories}>
            {(items) => (
              <BudgetForm
                categories={items}
                period={period}
                onSaved={() => {
                  setShowForm(false);
                  result.reload();
                  alerts.reload();
                }}
              />
            )}
          </DataState>
        </section>
      )}
      <DataState result={result}>{(items) => <BudgetList items={items} />}</DataState>
      <section>
        <h2>{text.alerts}</h2>
        <DataState result={alerts}>
          {(items) =>
            items.length ? (
              <ul className="records">
                {items.map((alert) => (
                  <li className="panel" key={alert.id}>
                    <strong>{alert.budget.category.name}</strong>
                    <p>
                      {text.threshold}: {alert.threshold_percentage}%
                    </p>
                    {alert.financial_tip?.content && (
                      <p>
                        <strong>{text.financialTip}</strong> · {alert.financial_tip.content}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{text.noAlerts}</p>
            )
          }
        </DataState>
      </section>
    </>
  );
}
