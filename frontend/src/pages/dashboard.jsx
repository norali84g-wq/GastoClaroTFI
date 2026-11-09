import { useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon } from '../components/brand.jsx';
import { DataState, formatMoney } from '../components/common.jsx';
import { useData } from '../hooks/data.js';
import { api, useSession } from '../hooks/session.js';
import { text } from '../texts.js';
import { BudgetSummary } from './budgets.jsx';

const monthFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortDate = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC' });

function Metric({ icon, tone, label, amount }) {
  return (
    <div className={`dashboard-metric ${tone}`}>
      <span className="metric-icon">
        <Icon name={icon} />
      </span>
      <div>
        <h2>{label}</h2>
        <p>{formatMoney(amount)}</p>
      </div>
    </div>
  );
}

const categoryColors = ['#296434', '#668b29', '#b98016', '#b2563b', '#4d7779', '#87785c'];

function CategoryBreakdown({ categories, total }) {
  const visible = categories.slice(0, 5);
  const remaining = categories.slice(5).reduce((sum, item) => sum + Number(item.total), 0);
  if (remaining) visible.push({ category_id: 'other', category: text.dashboardOther, total: remaining });
  let offset = 0;
  const slices = visible.map((item, index) => {
    const percentage = Number(item.total) / total * 100;
    const slice = { ...item, percentage, offset, color: categoryColors[index] };
    offset += percentage;
    return slice;
  });

  return (
    <div className="gc-category">
      <div className="gc-donut">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {slices.map(({ category_id, percentage, offset: start, color }) => (
            <circle key={category_id} cx="50" cy="50" r="40" pathLength="100"
              fill="none" stroke={color} strokeWidth="16"
              strokeDasharray={`${percentage} 100`} strokeDashoffset={-start}
              transform="rotate(-90 50 50)" />
          ))}
        </svg>
      </div>
      <ul className="gc-category-legend">
        {slices.map(({ category_id, category, percentage, color, total: amount }) => (
          <li key={category_id}>
            <span className="gc-category-dot" style={{ backgroundColor: color }} aria-hidden="true" />
            <span>{category}<small>{formatMoney(amount)}</small></span>
            <strong>{Math.round(percentage)}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategorySummary({ items }) {
  const categories = (items ?? [])
    .filter(({ total }) => Number(total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total));
  const total = categories.reduce((sum, item) => sum + Number(item.total), 0);

  return (
    <section className="panel dashboard-card">
      <h2>{text.consumptionByCategory}</h2>
      {categories.length ? (
        <CategoryBreakdown categories={categories} total={total} />
      ) : (
        <p className="muted">{text.noMonthlyExpenses}</p>
      )}
    </section>
  );
}

function RecentExpenses({ period }) {
  const load = useCallback((signal) => api.expenses(period, signal), [period]);
  const result = useData(load);

  return (
    <section className="panel dashboard-card">
      <div className="dashboard-card-title">
        <h2>{text.recentExpenses}</h2>
        <Link className="button secondary" to="/consumos">
          {text.viewExpenses}
        </Link>
      </div>
      <DataState result={result}>
        {(items) =>
          items.length ? (
            <ul className="dashboard-list">
              {items.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <span className="metric-icon">
                    <Icon name="cart" />
                  </span>
                  <div>
                    <strong>{item.description || item.category?.name}</strong>
                    <small>
                      {shortDate.format(new Date(`${item.date}T00:00:00Z`))} · {item.category?.name}
                    </small>
                  </div>
                  <strong>{formatMoney(item.amount)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{text.noMonthlyExpenses}</p>
          )
        }
      </DataState>
    </section>
  );
}

function MonthlyAlerts({ period }) {
  const load = useCallback((signal) => api.budgetAlerts(period, signal), [period]);
  const result = useData(load);

  return (
    <section className="panel dashboard-card">
      <h2>{text.alerts}</h2>
      <DataState result={result}>
        {(items) =>
          items.length ? (
            <ul className="dashboard-alerts">
              {items.map((item) => (
                <li key={item.id}>
                  <Icon name="alert" />
                  <div>
                    <strong>
                      {item.budget.category.name} · {item.threshold_percentage}%
                    </strong>
                    {item.financial_tip?.content && <p>{item.financial_tip.content}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{text.noAlerts}</p>
          )
        }
      </DataState>
    </section>
  );
}

const historySeries = [
  { field: 'income', label: text.dashboardIncome, tone: 'income' },
  { field: 'consumption', label: text.dashboardConsumption, tone: 'consumption' },
  { field: 'savings', label: text.dashboardSavings, tone: 'savings' },
];

const chartMonth = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' });

function MonthlyHistory({ months }) {
  const values = months.flatMap((month) => historySeries.map(({ field }) => Number(month[field])));
  if (!values.every(Number.isFinite)) return null;

  const min = Math.min(0, ...values);
  const range = Math.max(0, ...values) - min || 1;
  const monthLabel = (month) => chartMonth.format(new Date(`${month}-01T00:00:00Z`));

  return (
    <section className="panel dashboard-card gc-history">
      <h2>{text.moneyHistory}</h2>
      <ul className="gc-chart-legend">
        {historySeries.map(({ field, label, tone }) => (
          <li className={tone} key={field}>{label}</li>
        ))}
      </ul>
      <svg viewBox="0 0 360 132" aria-hidden="true">
        <path className="gc-chart-axis" d="M12 12v104h336" />
        {historySeries.map(({ field, tone }) => {
          const points = months.map((month, index) => {
            const x = 12 + (index / Math.max(1, months.length - 1)) * 336;
            const y = 116 - ((Number(month[field]) - min) / range) * 104;
            return [x, y];
          });
          return (
            <g className={tone} key={field}>
              <polyline points={points.map((point) => point.join(',')).join(' ')} />
              {points.map(([x, y], index) => <circle key={months[index].month} cx={x} cy={y} r="3" />)}
            </g>
          );
        })}
      </svg>
      <ul className="gc-chart-months" aria-hidden="true">
        {months.map(({ month }) => <li key={month}>{monthLabel(month)}</li>)}
      </ul>
      <details>
        <summary>Ver importes por mes</summary>
        <div className="gc-table-scroll">
          <table>
            <thead><tr><th scope="col">{text.period}</th>{historySeries.map(({ field, label }) => <th scope="col" key={field}>{label}</th>)}</tr></thead>
            <tbody>{months.map((month) => (
              <tr key={month.month}><th scope="row">{monthLabel(month.month)}</th>{historySeries.map(({ field }) => <td key={field}>{formatMoney(month[field])}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function Dashboard() {
  const result = useData(api.dashboard);
  const userName = useSession()?.user?.user;

  return (
    <div className="dashboard">
      <header className="dashboard-banner">
        <div>
          <p className="eyebrow">{text.slogan}</p>
          <h1>{userName ? text.dashboardGreeting(userName) : text.home}</h1>
          <p>{text.dashboardIntro}</p>
          {result.data?.period && (
            <time className="dashboard-period" dateTime={result.data.period}>
              {monthFormatter.format(new Date(`${result.data.period}-01T00:00:00Z`))}
            </time>
          )}
        </div>
      </header>

      <DataState result={result}>
        {(data) => (
          <>
            <p className="gc-equation">{text.moneyEquation}</p>
            <div className="dashboard-metrics">
              <Metric icon="wallet" tone="green" label={text.monthlyIncome} amount={data.income} />
              <Metric icon="cart" tone="rose" label={text.total} amount={data.consumption} />
              <Metric
                icon="savings"
                tone="gold"
                label={text.monthlySavings}
                amount={data.savings}
              />
            </div>
            <div className="dashboard-grid">
              <div className="dashboard-stack">
                <div className="gc-overview">
                  <CategorySummary items={data.consumption_by_category} />
                  {data.monthly_savings?.length > 0 && <MonthlyHistory months={data.monthly_savings} />}
                </div>
                <RecentExpenses period={data.period} />
              </div>
              <div className="dashboard-stack">
                <section className="panel dashboard-card gc-tip">
                  <h2>{text.dashboardTip} ♡</h2>
                  <p>{text.dashboardTipBody}</p>
                </section>
                <BudgetSummary period={data.period} />
                <MonthlyAlerts period={data.period} />
                <section className="panel dashboard-card">
                  <h2>{text.dashboardNextSteps}</h2>
                  <div className="dashboard-quick-actions">
                    <Link to="/consumos">
                      <Icon name="cart" />
                      {text.expenses}
                    </Link>
                    <Link to="/cuotas">
                      <Icon name="calendar" />
                      {text.viewInstallments}
                    </Link>
                    <Link to="/presupuestos">
                      <Icon name="budget" />
                      {text.budgets}
                    </Link>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
