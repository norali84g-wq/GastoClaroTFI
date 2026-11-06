import { useId } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { categoryDetailPath } from '../../config/constants';
import { formatAmount, formatPercentage, formatPeriod } from '../../utils/format';
import AdviceCard from './AdviceCard';
import BudgetProgress from './BudgetProgress';
import CategoryDonut from '../charts/CategoryDonut';
import MonthlyChart from '../charts/MonthlyChart';
import CategoryIcon from '../ui/CategoryIcon';
import EmptyState from '../ui/EmptyState';
import SavingsRing from './SavingsRing';
import TipCard from './TipCard';
import TitleIcon from '../ui/TitleIcon';

// Un mes tuvo movimientos si entró o salió plata.
function hasActivity({ income, consumption }) {
  return income !== 0 || consumption !== 0;
}

const TOTAL_ICONS = {
  income: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  consumption: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  savings: 'M3 17l6-6 4 4 8-8M15 7h6v6',
};

function TotalIcon({ name }) {
  return (
    <svg
      className="summary-total__icon"
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TOTAL_ICONS[name]} />
    </svg>
  );
}

function SummaryTotals({ summary }) {
  const { t } = useTranslation();
  const { income, consumption, savings, savingsGoalPercentage } = summary;
  const shareOfIncome = (amount) =>
    income > 0
      ? t('dashboard.summary.ofIncome', { percentage: formatPercentage(amount / income) })
      : null;

  // En el orden de la regla del panel: ingreso = consumo + ahorro.
  return (
    <dl className="summary-totals">
      <div className="summary-total summary-total--income">
        <dt>
          <TotalIcon name="income" />
          {t('dashboard.summary.income')}
        </dt>
        <dd className="summary-total__amount">{formatAmount(income)}</dd>
        <dd className="muted summary-total__context">{t('dashboard.summary.incomeContext')}</dd>
      </div>
      <div className="summary-total summary-total--consumption">
        <dt>
          <TotalIcon name="consumption" />
          {t('dashboard.summary.consumption')}
        </dt>
        <dd className="summary-total__amount">{formatAmount(consumption)}</dd>
        {shareOfIncome(consumption) && (
          <dd className="muted summary-total__context">{shareOfIncome(consumption)}</dd>
        )}
      </div>
      <div
        className={`summary-total summary-total--savings${savings < 0 ? ' summary-total--negative' : ''}`}
      >
        <dt>
          <TotalIcon name="savings" />
          {t('dashboard.summary.savings')}
        </dt>
        <dd className="summary-total__amount">{formatAmount(savings)}</dd>
        {savings > 0 && shareOfIncome(savings) && (
          <dd className="muted summary-total__context">{shareOfIncome(savings)}</dd>
        )}
        {savingsGoalPercentage > 0 && (
          <dd className="muted summary-total__context">
            {t('dashboard.summary.savingsGoal', {
              percentage: formatPercentage(savingsGoalPercentage / 100),
            })}
          </dd>
        )}
      </div>
    </dl>
  );
}

// Del rubro en el que más se gastó al que menos, con la parte del consumo del mes que representa.
function CategoryBreakdown({ summary, period }) {
  const { t } = useTranslation();
  const titleId = useId();
  const categories = summary.consumptionByCategory.toSorted(
    (a, b) => b.total - a.total || b.planned - a.planned,
  );

  return (
    <section aria-labelledby={titleId} className="panel">
      <h3 id={titleId} className="panel-title">
        <TitleIcon name="bars" tone="green" />
        {t('dashboard.summary.byCategory.title')}
      </h3>
      {categories.length === 0 ? (
        <p className="muted">{t('dashboard.summary.byCategory.empty', { period })}</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table data-table--stack" aria-labelledby={titleId}>
            <thead>
              <tr>
                <th scope="col">{t('expenses.fields.category')}</th>
                <th scope="col" className="numeric">
                  {t('expenses.fields.amount')}
                </th>
                <th scope="col" className="numeric">
                  {t('dashboard.summary.byCategory.planned')}
                </th>
                <th scope="col">{t('dashboard.summary.byCategory.progress')}</th>
                <th scope="col" className="numeric">
                  {t('dashboard.summary.byCategory.share')}
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map(({ categoryId, category, total, planned }) => (
                <tr key={categoryId ?? category}>
                  <td data-label={t('expenses.fields.category')}>
                    <span className="category-name">
                      <CategoryIcon name={category} />
                      {categoryId ? (
                        <Link to={categoryDetailPath(categoryId)}>{category}</Link>
                      ) : (
                        category
                      )}
                    </span>
                  </td>
                  <td data-label={t('expenses.fields.amount')} className="numeric">
                    {formatAmount(total)}
                  </td>
                  <td data-label={t('dashboard.summary.byCategory.planned')} className="numeric">
                    {formatAmount(planned)}
                  </td>
                  <td data-label={t('dashboard.summary.byCategory.progress')}>
                    <BudgetProgress spent={total} planned={planned} />
                  </td>
                  <td data-label={t('dashboard.summary.byCategory.share')} className="numeric">
                    {formatPercentage(summary.consumption > 0 ? total / summary.consumption : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Cuánto cambió el ahorro del último mes respecto del anterior, para leerlo de un vistazo.
function SavingsTrend({ months }) {
  const { t } = useTranslation();
  if (months.length < 2) return null;
  const delta = months.at(-1).savings - months.at(-2).savings;
  const tone = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
  const arrow = { up: '▲', down: '▼', same: '●' }[tone];
  return (
    <p className={`trend-chip trend-chip--${tone}`}>
      <span aria-hidden="true">{arrow}</span>
      {t(`dashboard.trend.${tone}`, { amount: formatAmount(Math.abs(delta)) })}
    </p>
  );
}

function MonthlySavings({ months }) {
  const { t } = useTranslation();
  const titleId = useId();
  const hintId = useId();

  return (
    <section aria-labelledby={titleId} className="panel">
      <h3 id={titleId} className="panel-title">
        <TitleIcon name="trend" tone="blue" />
        {t('dashboard.summary.monthly.title')}
      </h3>
      <SavingsTrend months={months} />
      <MonthlyChart months={months} />
      <p id={hintId} className="muted">
        {t('dashboard.summary.monthly.hint')}
      </p>
      <details className="chart-table">
        <summary>{t('dashboard.chart.showTable')}</summary>
        <div className="table-wrapper">
          <table
            className="data-table data-table--stack-wide"
            aria-labelledby={titleId}
            aria-describedby={hintId}
          >
            <thead>
              <tr>
                <th scope="col">{t('dashboard.summary.monthly.month')}</th>
                <th scope="col" className="numeric">
                  {t('dashboard.summary.income')}
                </th>
                <th scope="col" className="numeric">
                  {t('dashboard.summary.consumption')}
                </th>
                <th scope="col" className="numeric">
                  {t('dashboard.summary.savings')}
                </th>
                <th scope="col" className="numeric">
                  {t('dashboard.summary.monthly.accumulated')}
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month.month}>
                  <th scope="row">{formatPeriod(month.month)}</th>
                  <td data-label={t('dashboard.summary.income')} className="numeric">
                    {formatAmount(month.income)}
                  </td>
                  <td data-label={t('dashboard.summary.consumption')} className="numeric">
                    {formatAmount(month.consumption)}
                  </td>
                  <td data-label={t('dashboard.summary.savings')} className="numeric">
                    {formatAmount(month.savings)}
                  </td>
                  <td data-label={t('dashboard.summary.monthly.accumulated')} className="numeric">
                    {formatAmount(month.accumulated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

// Resumen del mes en curso que arma GET /dashboard. Si el mes no tuvo movimientos, lo dice en lugar
// de mostrar todo en cero; la evolución de los últimos meses aparece si alguno tuvo.
export default function DashboardSummary({ summary, goals }) {
  const { t } = useTranslation();
  const donutTitleId = useId();
  const period = formatPeriod(summary.period);

  return (
    <>
      <p className="muted">{period}</p>
      {hasActivity(summary) ? (
        <>
          <SummaryTotals summary={summary} />
          <div className="home-grid">
            <div className="home-grid__main">
              <CategoryBreakdown summary={summary} period={period} />
            </div>
            <div className="home-grid__side">
              <SavingsRing goal={goals?.[0]} />
              <AdviceCard summary={summary} goals={goals} />
            </div>
            <div className="home-grid__main">
              {summary.monthlySavings.some(hasActivity) && (
                <MonthlySavings months={summary.monthlySavings} />
              )}
            </div>
            <div className="home-grid__side">
              <section className="panel" aria-labelledby={donutTitleId}>
                <h3 id={donutTitleId} className="panel-title">
                  <TitleIcon name="pie" tone="orange" />
                  {t('dashboard.donut.title')}
                </h3>
                <CategoryDonut
                  categories={summary.consumptionByCategory}
                  total={summary.consumption}
                />
              </section>
              <TipCard />
            </div>
          </div>
        </>
      ) : (
        <>
          <EmptyState
            headingLevel={3}
            title={t('dashboard.summary.emptyTitle', { period })}
            description={t('dashboard.summary.emptyDescription')}
          />
          {summary.monthlySavings.some(hasActivity) && (
            <MonthlySavings months={summary.monthlySavings} />
          )}
        </>
      )}
    </>
  );
}
