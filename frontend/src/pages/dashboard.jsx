import { useCallback, useContext, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon } from '../components/brand.jsx';
import { CategoriaIcono } from '../components/categoria-icono.jsx';
import { BudgetAlertList, useMonthAlerts } from '../components/budget-alerts.jsx';
import { CategoryBreakdown, MonthlyHistory } from '../components/charts.jsx';
import { Chanchito, Status } from '../components/chanchito.jsx';
import { DataState, Field, formatMoney } from '../components/common.jsx';
import { GoalCard } from '../components/goal-card.jsx';
import { Progress } from '../components/planning.jsx';
import { shiftPeriod } from '../domain/periods.js';
import { useData } from '../hooks/data.js';
import { AccountContext, api } from '../hooks/session.js';
import { text } from '../texts.js';

const monthFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const percentFormatter = new Intl.NumberFormat('es-AR', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const monthLabel = (period) => monthFormatter.format(new Date(`${period}-01T00:00:00Z`));

function Metric({ icon, tone, label, amount, previous }) {
  const baseline = Number(previous);
  const variation = baseline
    ? text.monthVariation(percentFormatter.format((Number(amount) - baseline) / Math.abs(baseline)))
    : null;

  return (
    <div className={`dashboard-metric ${tone}`}>
      <span className="metric-icon">
        <Icon name={icon} />
      </span>
      <div>
        <h2>{label}</h2>
        <p>{formatMoney(amount)}</p>
        {variation && <small>{variation}</small>}
      </div>
    </div>
  );
}

function MonthOverview({ dashboard, period }) {
  const first = shiftPeriod(period, -5);
  const year = period.slice(0, 4);
  const firstYear = first.slice(0, 4);
  const load = useCallback(
    async (signal) => {
      const [selected, previous] = await Promise.all([
        api.statistics(year, Number(period.slice(5)), signal),
        firstYear !== year && Number(firstYear) >= 2000
          ? api.statistics(firstYear, '', signal)
          : null,
      ]);
      return { selected, months: [...(previous?.months ?? []), ...selected.months] };
    },
    [year, firstYear, period],
  );
  const stats = useData(load);

  return (
    <DataState result={stats}>
      {({ selected, months }) => {
        const previous = months.find((item) => item.month === shiftPeriod(period, -1));
        const current = period === dashboard.period;
        const row = current ? dashboard : months.find((item) => item.month === period);
        const metrics = row ?? { income: 0, consumption: 0, savings: 0 };
        const categories = current
          ? dashboard.consumption_by_category
          : selected.by_category.map((item) => ({
              category_id: item.category.id,
              category: item.category.name,
              total: item.total,
              reportedPercentage: item.percentage,
            }));
        const breakdown = [...categories].sort((a, b) => Number(b.total) - Number(a.total));

        return (
          <>
            {Number(metrics.income) === 0 && Number(metrics.consumption) === 0 && (
              <Status message={text.noDashboardData} />
            )}
            <div className="dashboard-metrics">
              <Metric
                icon="wallet"
                tone="green"
                label={text.monthlyIncome}
                amount={metrics.income}
                previous={previous?.income}
              />
              <Metric
                icon="cart"
                tone="rose"
                label={text.total}
                amount={metrics.consumption}
                previous={previous?.consumption}
              />
              <Metric
                icon="savings"
                tone="green"
                label={text.monthlySavings}
                amount={metrics.savings}
                previous={previous?.savings}
              />
            </div>
            <div className="gc-overview">
              <section className="panel dashboard-card">
                <h2>{text.consumptionByCategory}</h2>
                <CategoryBreakdown
                  categories={breakdown}
                  total={breakdown.reduce((sum, item) => sum + Number(item.total), 0)}
                />
              </section>
              <MonthlyHistory
                months={months.filter((item) => item.month >= first && item.month <= period)}
              />
            </div>
          </>
        );
      }}
    </DataState>
  );
}

function GoalSummary() {
  const goals = useData(api.savingsGoals);
  return (
    <section className="panel dashboard-card">
      <h2>{text.mainGoal}</h2>
      <DataState result={goals}>
        {(items) => {
          const goal = items.find((item) => Number(item.progress_percentage) < 100) ?? items[0];
          return goal ? <GoalCard goal={goal} /> : <Status message={text.noGoals} />;
        }}
      </DataState>
      <Link to="/metas">{text.savingsGoals}</Link>
    </section>
  );
}

function BudgetSummary({ period }) {
  const load = useCallback((signal) => api.budgets(period, signal), [period]);
  const budgets = useData(load);
  return (
    <section className="panel dashboard-card">
      <h2>{text.budgetOfMonth}</h2>
      <DataState result={budgets}>
        {(items) =>
          items.length ? (
            <ul className="records movement-list">
              {items.slice(0, 3).map((item) => (
                <li key={item.id} className="gc-budget-summary">
                  <div className="gc-category-heading">
                    <CategoriaIcono nombre={item.category.name} id={item.category.id} />
                    <strong>{item.category.name}</strong>
                  </div>
                  <small>
                    {formatMoney(item.spent)} / {formatMoney(item.amount)}
                  </small>
                  <Progress
                    label={text.budgetProgress(item.category.name)}
                    percentage={item.percentage}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Status message={text.noMonthlyBudgets} />
          )
        }
      </DataState>
      <Link to="/presupuestos" search={{ period }}>
        {text.viewBudgets}
      </Link>
    </section>
  );
}

function RecentExpenses({ period }) {
  const load = useCallback((signal) => api.expenses(period, signal), [period]);
  const expenses = useData(load);
  return (
    <section className="panel dashboard-card">
      <div className="dashboard-card-title">
        <h2>{text.lastExpenses}</h2>
        <Link className="button secondary" to="/consumos" search={{ period }}>
          {text.allExpenses}
        </Link>
      </div>
      <DataState result={expenses}>
        {(items) =>
          items.length ? (
            <ul className="dashboard-list">
              {items.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <CategoriaIcono nombre={item.category.name} id={item.category.id} size={44} />
                  <div>
                    <Link to="/consumos" search={{ period, expense: item.id }}>
                      {item.description || item.category.name}
                    </Link>
                    <small>
                      <time dateTime={item.date}>{item.date}</time> · {item.category.name}
                    </small>
                  </div>
                  <strong>{formatMoney(item.amount)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <Status message={text.noMonthlyExpenses} />
          )
        }
      </DataState>
    </section>
  );
}

async function upcomingInstallment(period, signal) {
  const purchases = await api.purchases(signal);
  const candidates = purchases.filter(
    (purchase) => shiftPeriod(purchase.first_period, purchase.installments_count - 1) >= period,
  );
  const pending = await Promise.all(
    candidates.map(async (purchase) => {
      try {
        const items = await api.installments(purchase.id, signal);
        const next = items.find((item) => !item.paid && item.period >= period);
        return next && { ...next, description: purchase.description };
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
    }),
  );
  return pending.filter(Boolean).sort((a, b) => a.period.localeCompare(b.period))[0];
}

function InstallmentSummary({ period, currentPeriod }) {
  const loadTotal = useCallback((signal) => api.installmentMonthlyTotal(period, signal), [period]);
  const loadUpcoming = useCallback(
    (signal) => upcomingInstallment(currentPeriod, signal),
    [currentPeriod],
  );
  const total = useData(loadTotal);
  const next = useData(loadUpcoming);
  return (
    <section className="panel dashboard-card">
      <h2>{text.upcomingInstallment}</h2>
      <DataState result={next}>
        {(item) =>
          item ? (
            <div className="gc-alert gc-alert-orange">
              <Chanchito pose="sorprendido" size={60} />
              <div>
                <strong>{item.description}</strong>
                <p>
                  <time dateTime={item.period}>{monthLabel(item.period)}</time> ·{' '}
                  {formatMoney(item.amount)}
                </p>
              </div>
            </div>
          ) : (
            <Status message={text.noUpcomingInstallments} />
          )
        }
      </DataState>
      <DataState result={total}>
        {(data) => (
          <p>
            <strong>{text.installmentMonthTotal}</strong> · {formatMoney(data.installments_total)}
          </p>
        )}
      </DataState>
      <Link to="/cuotas">{text.viewInstallments}</Link>
    </section>
  );
}

function DashboardAlerts({ period }) {
  const alerts = useMonthAlerts(period);
  const tip = alerts.data?.find((item) => item.financial_tip?.content)?.financial_tip.content;
  return (
    <>
      {tip && (
        <section className="panel dashboard-card gc-advice">
          <Chanchito pose="feliz" size={80} />
          <div>
            <h2>{text.dashboardTip} ♡</h2>
            <p>{tip}</p>
          </div>
        </section>
      )}
      <section className="panel dashboard-card">
        <h2>{text.alerts}</h2>
        <BudgetAlertList result={alerts} />
      </section>
    </>
  );
}

function QuickActions() {
  return (
    <section className="panel dashboard-card">
      <h2>{text.dashboardNextSteps}</h2>
      <div className="dashboard-quick-actions">
        <Link to="/consumos" search={{ new: true }}>
          <Icon name="plus" />
          {text.newExpense}
        </Link>
        <Link to="/ingresos" search={{ new: true }}>
          <Icon name="wallet" />
          {text.quickIncome}
        </Link>
        <Link to="/lista-de-compras">
          <Icon name="cart" />
          {text.shoppingList}
        </Link>
        <Link to="/metas" search={{ new: true }}>
          <Icon name="goal" />
          {text.newGoal}
        </Link>
      </div>
    </section>
  );
}

function DashboardContent({ dashboard, months, user }) {
  const [selection, setSelection] = useState('');
  const periods = months
    .filter((item) => Number(item.income) !== 0 || Number(item.consumption) !== 0)
    .map((item) => item.month)
    .reverse();
  const period = selection || periods[0] || dashboard.period;
  return (
    <>
      <DashboardBanner user={user}>
        {periods.length ? (
          <div className="gc-dashboard-month">
            <Field
              label={text.period}
              value={period}
              onChange={(event) => setSelection(event.target.value)}
            >
              {periods.map((month) => (
                <option key={month} value={month}>
                  {monthLabel(month)}
                </option>
              ))}
            </Field>
          </div>
        ) : (
          <time className="dashboard-period" dateTime={period}>
            {monthLabel(period)}
          </time>
        )}
      </DashboardBanner>
      <p className="gc-equation">{text.moneyEquation}</p>
      <div className="dashboard-grid">
        <div className="dashboard-stack">
          <MonthOverview dashboard={dashboard} period={period} />
          <div className="gc-overview">
            <GoalSummary />
            <BudgetSummary period={period} />
          </div>
          <RecentExpenses period={period} />
        </div>
        <div className="dashboard-stack">
          <DashboardAlerts period={period} />
          <InstallmentSummary period={period} currentPeriod={dashboard.period} />
          <QuickActions />
        </div>
      </div>
    </>
  );
}

function DashboardBanner({ user, children }) {
  return (
    <header className="dashboard-banner">
      <img
        className="gc-dashboard-art"
        src="/gastoclaro-hero.webp"
        alt=""
        width="920"
        height="613"
        loading="lazy"
        decoding="async"
      />
      <div>
        <p className="eyebrow">{text.slogan}</p>
        <h1>{text.dashboardGreeting(user)}</h1>
        <p>{text.dashboardIntro}</p>
        {children}
      </div>
    </header>
  );
}

export function Dashboard() {
  const result = useData(api.dashboard);
  const savings = useData(api.savings);
  const { user } = useContext(AccountContext);
  const ready = result.data && savings.data;

  return (
    <div className="dashboard">
      {!ready && <DashboardBanner user={user} />}
      <DataState result={result}>
        {(data) => (
          <DataState result={savings}>
            {({ months }) => <DashboardContent dashboard={data} months={months} user={user} />}
          </DataState>
        )}
      </DataState>
    </div>
  );
}
