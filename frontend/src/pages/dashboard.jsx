import { BudgetSummary } from './budgets.jsx';
import { Link } from '@tanstack/react-router';
import { DataState, formatMoney } from '../components/common.jsx';
import { useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

export function Dashboard() {
  const result = useData(api.dashboard);
  return (
    <>
      <p className="eyebrow">{text.slogan}</p>
      <h1>{text.home}</h1>
      <DataState result={result}>
        {(data) => (
          <>
            <section className="panel hero-card">
              <p>{data.period}</p>
              <h2>{text.total}</h2>
              <p className="total">{formatMoney(data.consumption)}</p>
              <Link className="button" to="/consumos">
                {text.newExpense}
              </Link>
            </section>
            <BudgetSummary period={data.period} />
          </>
        )}
      </DataState>
    </>
  );
}
