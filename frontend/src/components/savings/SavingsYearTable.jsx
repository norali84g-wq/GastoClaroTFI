import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatAmount, formatPeriod } from '../../utils/format';

// Ahorro de un año: un renglón por mes y, al final, el total del año. El acumulado de cada mes
// llega de la API (suma corrida desde el primer movimiento); el total del año no lo lleva.
export default function SavingsYearTable({ year }) {
  const { t } = useTranslation();
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="panel">
      <h3 id={titleId}>{year.year}</h3>
      <div className="table-wrapper">
        <table className="data-table data-table--stack-wide" aria-labelledby={titleId}>
          <thead>
            <tr>
              <th scope="col">{t('savings.fields.month')}</th>
              <th scope="col" className="numeric">
                {t('savings.fields.income')}
              </th>
              <th scope="col" className="numeric">
                {t('savings.fields.consumption')}
              </th>
              <th scope="col" className="numeric">
                {t('savings.fields.savings')}
              </th>
              <th scope="col" className="numeric">
                {t('savings.fields.accumulated')}
              </th>
            </tr>
          </thead>
          <tbody>
            {year.months.map((month) => (
              <tr key={month.month}>
                <th scope="row">{formatPeriod(month.month)}</th>
                <td data-label={t('savings.fields.income')} className="numeric">
                  {formatAmount(month.income)}
                </td>
                <td data-label={t('savings.fields.consumption')} className="numeric">
                  {formatAmount(month.consumption)}
                </td>
                <td data-label={t('savings.fields.savings')} className="numeric">
                  {formatAmount(month.savings)}
                </td>
                <td data-label={t('savings.fields.accumulated')} className="numeric">
                  {formatAmount(month.accumulated)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{t('savings.total', { year: year.year })}</th>
              <td data-label={t('savings.fields.income')} className="numeric">
                {formatAmount(year.income)}
              </td>
              <td data-label={t('savings.fields.consumption')} className="numeric">
                {formatAmount(year.consumption)}
              </td>
              <td data-label={t('savings.fields.savings')} className="numeric">
                {formatAmount(year.savings)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
