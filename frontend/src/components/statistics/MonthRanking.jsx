import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatAmount, formatPeriod } from '../../utils/format';
import { rankMonths } from '../../utils/statistics';
import TitleIcon from '../ui/TitleIcon';

// Los meses con más consumo, más ahorro o más gasto hormiga, de mayor a menor, con una barra
// proporcional al primero. Cada mes lleva su importe: la barra sola no alcanza.
export default function MonthRanking({ months, field, tone, icon }) {
  const { t } = useTranslation();
  const titleId = useId();
  const ranking = rankMonths(months, field);
  const max = ranking[0]?.[field] ?? 0;

  return (
    <section className="panel ranking" aria-labelledby={titleId}>
      <h3 id={titleId} className="panel-title">
        <TitleIcon name={icon} tone={tone} />
        {t(`statistics.rankings.${field}`)}
      </h3>
      {ranking.length === 0 ? (
        <p className="muted">{t('statistics.rankings.empty')}</p>
      ) : (
        <ol className="ranking__list">
          {ranking.map((row) => (
            <li key={row.month}>
              <div className="ranking__top">
                <span>{formatPeriod(row.month)}</span>
                <strong className="mono">{formatAmount(row[field])}</strong>
              </div>
              <div className="ranking__track" aria-hidden="true">
                <div
                  className={`ranking__fill ranking__fill--${tone}`}
                  style={{ width: `${(row[field] / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
