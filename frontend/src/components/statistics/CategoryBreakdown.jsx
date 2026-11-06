import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatAmount, formatPercentage } from '../../utils/format';
import CategoryIcon from '../ui/CategoryIcon';
import TitleIcon from '../ui/TitleIcon';

function Share({ percentage }) {
  return (
    <div className="share" aria-hidden="true">
      <div className="share__fill" style={{ width: `${Math.min(percentage, 100)}%` }} />
    </div>
  );
}

// El consumo del período por categoría principal, con su parte del total y, adentro, cada
// subcategoría con lo gastado, lo planificado y si se pasó.
export default function CategoryBreakdown({ groups }) {
  const { t } = useTranslation();
  const titleId = useId();
  const withMovement = groups.filter(
    (group) => group.total > 0 || group.subcategories.some((sub) => sub.planned > 0),
  );

  return (
    <section className="panel" aria-labelledby={titleId}>
      <h3 id={titleId} className="panel-title">
        <TitleIcon name="pie" tone="orange" />
        {t('statistics.byCategory.title')}
      </h3>
      {withMovement.length === 0 ? (
        <p className="muted">{t('statistics.byCategory.empty')}</p>
      ) : (
        <ul className="breakdown">
          {withMovement.map((group) => (
            <li key={group.id}>
              <div className="breakdown__top">
                <span className="category-name">
                  <CategoryIcon name={group.name} />
                  <strong>{group.name}</strong>
                </span>
                <span>
                  <strong className="mono">{formatAmount(group.total)}</strong>{' '}
                  <span className="muted">({formatPercentage(group.percentage / 100)})</span>
                </span>
              </div>
              <Share percentage={group.percentage} />
              {group.subcategories.length > 0 && (
                <ul className="breakdown__subs">
                  {group.subcategories.map((sub) => (
                    <li key={sub.id}>
                      <span>{sub.name}</span>
                      <span className="mono">{formatAmount(sub.real)}</span>
                      <span className="muted">
                        {t('statistics.byCategory.planned', { amount: formatAmount(sub.planned) })}
                      </span>
                      {sub.overBudget && (
                        <span className="status-chip status-chip--over">
                          <span aria-hidden="true">✕</span>
                          {t('statistics.byCategory.overBudget')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
