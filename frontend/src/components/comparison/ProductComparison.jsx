import { useTranslation } from 'react-i18next';
import { PRODUCT_STATUS } from '../../api/categoryComparison';
import { formatAmount } from '../../utils/format';

const STATUS_ICON = {
  [PRODUCT_STATUS.BOUGHT]: '✓',
  [PRODUCT_STATUS.UNPLANNED]: '!',
  [PRODUCT_STATUS.NOT_BOUGHT]: '–',
};

// Una fila por producto: lo estimado (cantidad por precio) contra lo real, con su estado dicho con
// texto y con un símbolo, no solo con color.
export default function ProductComparison({ items }) {
  const { t } = useTranslation();

  return (
    <div className="table-wrapper">
      <table className="data-table data-table--stack">
        <caption>{t('categoryDetail.products.caption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('categoryDetail.products.name')}</th>
            <th scope="col">{t('categoryDetail.products.planned')}</th>
            <th scope="col">{t('categoryDetail.products.real')}</th>
            <th scope="col">{t('categoryDetail.products.status')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.name}>
              <td data-label={t('categoryDetail.products.name')}>{item.name}</td>
              <td data-label={t('categoryDetail.products.planned')}>
                {item.plannedTotal > 0 ? (
                  <>
                    <span className="muted">
                      {item.plannedQuantity} × {formatAmount(item.plannedUnitPrice)}
                    </span>
                    <br />
                    <strong className="mono">{formatAmount(item.plannedTotal)}</strong>
                  </>
                ) : (
                  <span className="muted">{t('categoryDetail.products.noPlan')}</span>
                )}
              </td>
              <td data-label={t('categoryDetail.products.real')}>
                {item.realTotal > 0 ? (
                  <>
                    <span className="muted">
                      {item.realQuantity} × {formatAmount(item.realUnitPrice)}
                    </span>
                    <br />
                    <strong className="mono">{formatAmount(item.realTotal)}</strong>
                  </>
                ) : (
                  <span className="muted">{t('categoryDetail.products.notBought')}</span>
                )}
              </td>
              <td data-label={t('categoryDetail.products.status')}>
                <span className={`status-chip status-chip--${item.status}`}>
                  <span aria-hidden="true">{STATUS_ICON[item.status]}</span>
                  {t(`categoryDetail.products.statuses.${item.status}`)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
