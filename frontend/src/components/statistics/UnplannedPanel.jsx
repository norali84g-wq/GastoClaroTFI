import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatAmount, formatDate } from '../../utils/format';
import TitleIcon from '../ui/TitleIcon';

// El gasto hormiga del período: lo que se compró y no estaba en la lista de gastos fijos. Total,
// por comercio y producto por producto.
export default function UnplannedPanel({ unplanned }) {
  const { t } = useTranslation();
  const titleId = useId();

  return (
    <section className="panel" aria-labelledby={titleId}>
      <h3 id={titleId} className="panel-title">
        <TitleIcon name="alert" tone="orange" />
        {t('statistics.unplanned.title')}
      </h3>
      <p className="muted">{t('statistics.unplanned.note')}</p>
      <p className="unplanned-total">
        <span className="muted">{t('statistics.unplanned.total')}</span>{' '}
        <strong className="mono">{formatAmount(unplanned.total)}</strong>
      </p>
      {unplanned.items.length === 0 ? (
        <p className="muted">{t('statistics.unplanned.empty')}</p>
      ) : (
        <>
          <h4>{t('statistics.unplanned.byVendor')}</h4>
          <ul className="vendor-list">
            {unplanned.byVendor.map((row) => (
              <li key={row.vendor ?? 'none'}>
                <span>{row.vendor ?? t('statistics.unplanned.noVendor')}</span>
                <strong className="mono">{formatAmount(row.total)}</strong>
              </li>
            ))}
          </ul>
          <div className="table-wrapper">
            <table className="data-table data-table--stack">
              <caption>{t('statistics.unplanned.caption')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('statistics.unplanned.date')}</th>
                  <th scope="col">{t('statistics.unplanned.product')}</th>
                  <th scope="col">{t('statistics.unplanned.vendor')}</th>
                  <th scope="col" className="numeric">
                    {t('statistics.unplanned.subtotal')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {unplanned.items.map((item, index) => (
                  <tr key={`${item.date}-${item.name}-${index}`}>
                    <td data-label={t('statistics.unplanned.date')}>
                      <time dateTime={item.date}>{formatDate(item.date)}</time>
                    </td>
                    <td data-label={t('statistics.unplanned.product')}>
                      {item.name} ({item.quantity} × {formatAmount(item.unitPrice)})
                    </td>
                    <td data-label={t('statistics.unplanned.vendor')}>
                      {item.vendor ?? t('statistics.unplanned.noVendor')}
                    </td>
                    <td data-label={t('statistics.unplanned.subtotal')} className="numeric">
                      {formatAmount(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
