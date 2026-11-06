import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/constants';
import { useCategoryComparison } from '../hooks/useCategoryComparison';
import { currentPeriod, isValidPeriod } from '../utils/dates';
import { requestErrorMessages } from '../utils/errors';
import { formatAmount, formatPeriod } from '../utils/format';
import ProductComparison from '../components/comparison/ProductComparison';
import SubcategoryComparison from '../components/comparison/SubcategoryComparison';
import BudgetProgress from '../components/dashboard/BudgetProgress';
import EmptyState from '../components/ui/EmptyState';
import FormAlert from '../components/ui/FormAlert';
import FormField from '../components/ui/FormField';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';

// Detalle de una categoría en un mes: lo estimado (lista de gastos fijos) contra lo real (gastos).
// Con subcategorías, una fila por cada una; sin ellas, una fila por producto.
export default function CategoryDetailPage() {
  const { t } = useTranslation();
  const { categoryId } = useParams();
  // `periodInput` es lo que está escrito en el filtro; `period`, el último mes válido.
  const [period, setPeriod] = useState(currentPeriod);
  const [periodInput, setPeriodInput] = useState(period);
  const { comparison, isLoading, error, retry } = useCategoryComparison(categoryId, period);

  function changePeriod(value) {
    setPeriodInput(value);
    if (isValidPeriod(value)) setPeriod(value);
  }

  function renderContent() {
    if (isLoading) return <LoadingIndicator label={t('categoryDetail.loading')} />;
    if (error) {
      return (
        <FormAlert
          messages={requestErrorMessages(error, 'categoryDetail.loadError', t)}
          onRetry={retry}
        />
      );
    }
    const empty = comparison.subcategories.length === 0 && comparison.items.length === 0;
    if (empty) {
      return (
        <EmptyState
          headingLevel={3}
          title={t('categoryDetail.emptyTitle', { period: formatPeriod(period) })}
          description={t('categoryDetail.emptyDescription')}
        />
      );
    }
    return (
      <>
        <dl className="comparison-totals">
          <div className="summary-total">
            <dt>{t('categoryDetail.planned')}</dt>
            <dd className="summary-total__amount">{formatAmount(comparison.plannedTotal)}</dd>
          </div>
          <div className="summary-total">
            <dt>{t('categoryDetail.real')}</dt>
            <dd className="summary-total__amount">{formatAmount(comparison.realTotal)}</dd>
          </div>
        </dl>
        <div className="comparison-progress">
          <BudgetProgress spent={comparison.realTotal} planned={comparison.plannedTotal} />
        </div>
        <section className="panel">
          {comparison.subcategories.length > 0 ? (
            <SubcategoryComparison subcategories={comparison.subcategories} />
          ) : (
            <ProductComparison items={comparison.items} />
          )}
        </section>
      </>
    );
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow={t('categoryDetail.eyebrow')}
        title={comparison?.category.name ?? t('categoryDetail.title')}
      />
      <p>
        <Link to={ROUTES.DASHBOARD}>{t('categoryDetail.back')}</Link>
      </p>
      <div className="comparison-filter">
        <FormField
          label={t('categoryDetail.filter')}
          name="period"
          type="month"
          value={periodInput}
          onChange={(event) => changePeriod(event.target.value)}
          errors={isValidPeriod(periodInput) ? undefined : t('expenses.filter.invalid')}
        />
      </div>
      {renderContent()}
    </section>
  );
}
