import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getSavings } from '../api/savings';
import { ROUTES } from '../config/constants';
import { useRemoteData } from '../hooks/useRemoteData';
import { requestErrorMessages } from '../utils/errors';
import { formatPercentage } from '../utils/format';
import { groupByYear } from '../utils/savings';
import { AccumulatedLine, MonthlySavingsBars } from '../components/charts/SavingsCharts';
import SavingsYearTable from '../components/savings/SavingsYearTable';
import EmptyState from '../components/ui/EmptyState';
import FormAlert from '../components/ui/FormAlert';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';

// Ahorro: el detalle mes a mes, año por año, de lo que entró, lo que se consumió y lo que se
// ahorró, con el acumulado. Es lo que Inicio resume en los últimos 6 meses.
export default function SavingsPage() {
  const { t } = useTranslation();
  const { data, isLoading, error, retry } = useRemoteData(getSavings);

  function renderContent() {
    if (isLoading) return <LoadingIndicator label={t('savings.loading')} />;
    if (error) {
      return (
        <FormAlert messages={requestErrorMessages(error, 'savings.loadError', t)} onRetry={retry} />
      );
    }
    if (data.months.length === 0) {
      return (
        <EmptyState
          headingLevel={2}
          title={t('savings.emptyTitle')}
          description={t('savings.emptyDescription')}
        />
      );
    }
    return (
      <>
        <div className="savings-charts">
          <section className="panel" aria-labelledby="savings-monthly-title">
            <h2 id="savings-monthly-title">{t('savings.charts.monthly')}</h2>
            <MonthlySavingsBars months={data.months} />
          </section>
          <section className="panel" aria-labelledby="savings-accumulated-title">
            <h2 id="savings-accumulated-title">{t('savings.charts.accumulated')}</h2>
            <AccumulatedLine months={data.months} />
          </section>
        </div>
        <p className="muted">{t('savings.note')}</p>
        {groupByYear(data.months).map((year) => (
          <SavingsYearTable key={year.year} year={year} />
        ))}
      </>
    );
  }

  return (
    <section className="page">
      <PageHeader eyebrow={t('nav.savings')} title={t('savings.title')} />
      {data && data.savingsGoalPercentage > 0 && (
        <p>
          {t('savings.goalPercentage', {
            percentage: formatPercentage(data.savingsGoalPercentage / 100),
          })}
        </p>
      )}
      <p>
        <Link to={ROUTES.SAVINGS_GOALS}>{t('savings.goalsLink')}</Link>
      </p>
      {renderContent()}
    </section>
  );
}
