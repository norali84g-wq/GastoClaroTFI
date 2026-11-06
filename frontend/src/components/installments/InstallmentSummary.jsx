import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { summarizeByCategory } from '../../utils/installments';
import { formatAmount } from '../../utils/format';

// Cuánto se paga por mes en cada categoría (cada tarjeta) por las compras en cuotas que todavía
// tienen cuotas por pagar. No se muestra si no hay ninguna.
export default function InstallmentSummary({ purchases, categories }) {
  const { t } = useTranslation();
  const titleId = useId();
  const summary = summarizeByCategory(purchases, categories);

  if (summary.length === 0) return null;

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId}>{t('installments.summary.title')}</h3>
      <p className="muted installments__note">{t('installments.summary.note')}</p>
      <div className="table-wrapper">
        <table className="data-table data-table--stack" aria-labelledby={titleId}>
          <thead>
            <tr>
              <th scope="col">{t('installments.fields.category')}</th>
              <th scope="col" className="numeric">
                {t('installments.summary.purchases')}
              </th>
              <th scope="col" className="numeric">
                {t('installments.summary.monthly')}
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.map(({ categoryId, name, count, monthlyAmount }) => (
              <tr key={categoryId}>
                <td data-label={t('installments.fields.category')}>
                  {name ?? <span className="muted">{t('installments.list.unknownCategory')}</span>}
                </td>
                <td data-label={t('installments.summary.purchases')} className="numeric">
                  {count}
                </td>
                <td data-label={t('installments.summary.monthly')} className="numeric">
                  {formatAmount(monthlyAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
