import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStatistics } from '../hooks/useStatistics';
import { requestErrorMessages } from '../utils/errors';
import { formatMonthName } from '../utils/format';
import MonthlyChart from '../components/charts/MonthlyChart';
import CategoryBreakdown from '../components/statistics/CategoryBreakdown';
import MonthRanking from '../components/statistics/MonthRanking';
import UnplannedPanel from '../components/statistics/UnplannedPanel';
import FormAlert from '../components/ui/FormAlert';
import FormField from '../components/ui/FormField';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';
import TitleIcon from '../components/ui/TitleIcon';

const MONTH_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);
const ALL_YEAR = '';

// Estadísticas del año (o de un mes): evolución, rankings de meses, consumo por categoría y gasto
// hormiga. Los números los arma la API; acá solo se ordenan y se muestran.
export default function StatisticsPage() {
  const { t } = useTranslation();
  const chartTitleId = useId();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(ALL_YEAR);
  const { statistics, isLoading, error, retry } = useStatistics(year, month ? Number(month) : null);

  function renderContent() {
    if (isLoading) return <LoadingIndicator label={t('statistics.loading')} />;
    if (error) {
      return (
        <FormAlert
          messages={requestErrorMessages(error, 'statistics.loadError', t)}
          onRetry={retry}
        />
      );
    }
    return (
      <>
        <section className="panel statistics-chart" aria-labelledby={chartTitleId}>
          <h3 id={chartTitleId} className="panel-title">
            <TitleIcon name="trend" tone="blue" />
            {t('statistics.chartTitle', { year: statistics.year })}
          </h3>
          <MonthlyChart months={statistics.months} />
        </section>
        <div className="rankings">
          <MonthRanking months={statistics.months} field="consumption" tone="orange" icon="bars" />
          <MonthRanking months={statistics.months} field="savings" tone="blue" icon="trend" />
          <MonthRanking months={statistics.months} field="unplanned" tone="pink" icon="alert" />
        </div>
        <div className="statistics-grid">
          <CategoryBreakdown groups={statistics.byCategory} />
          <UnplannedPanel unplanned={statistics.unplanned} />
        </div>
      </>
    );
  }

  const years = statistics?.availableYears ?? [year];

  return (
    <section className="page">
      <PageHeader eyebrow={t('nav.statistics')} title={t('statistics.title')} />
      <div className="statistics-filters">
        <FormField
          as="select"
          label={t('statistics.year')}
          name="year"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
        >
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FormField>
        <FormField
          as="select"
          label={t('statistics.month')}
          name="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        >
          <option value={ALL_YEAR}>{t('statistics.allYear')}</option>
          {MONTH_NUMBERS.map((number) => (
            <option key={number} value={number}>
              {formatMonthName(number)}
            </option>
          ))}
        </FormField>
      </div>
      {renderContent()}
    </section>
  );
}
