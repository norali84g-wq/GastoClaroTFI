import { useTranslation } from 'react-i18next';
import { BUDGET_STATUS, budgetStatus } from '../../utils/budget';
import { formatPercentage } from '../../utils/format';

// Barra de avance del consumo de una categoría sobre lo planificado. El estado también se dice con
// texto: el color solo no alcanza.
export default function BudgetProgress({ spent, planned }) {
  const { t } = useTranslation();
  const status = budgetStatus(spent, planned);

  if (status === BUDGET_STATUS.NONE) {
    return <span className="muted">{t('dashboard.summary.byCategory.noPlan')}</span>;
  }

  const ratio = spent / planned;

  return (
    <div className={`budget-progress budget-progress--${status}`}>
      <div className="budget-progress__track" aria-hidden="true">
        <div className="budget-progress__fill" style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>
      <span className="budget-progress__text">
        {t('dashboard.summary.byCategory.progressText', {
          percentage: formatPercentage(ratio),
          status: t(`dashboard.summary.byCategory.status.${status}`),
        })}
      </span>
    </div>
  );
}
