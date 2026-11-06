import { useTranslation } from 'react-i18next';
import { formatAmount } from '../../utils/format';
import BudgetProgress from '../dashboard/BudgetProgress';

// Una fila por subcategoría: lo estimado, lo real y el avance sobre lo planificado (la misma barra
// que usa Inicio).
export default function SubcategoryComparison({ subcategories }) {
  const { t } = useTranslation();

  return (
    <div className="table-wrapper">
      <table className="data-table data-table--stack">
        <caption>{t('categoryDetail.subcategories.caption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('categoryDetail.subcategories.name')}</th>
            <th scope="col" className="numeric">
              {t('categoryDetail.planned')}
            </th>
            <th scope="col" className="numeric">
              {t('categoryDetail.real')}
            </th>
            <th scope="col">{t('categoryDetail.subcategories.progress')}</th>
          </tr>
        </thead>
        <tbody>
          {subcategories.map((row) => (
            <tr key={row.id}>
              <td data-label={t('categoryDetail.subcategories.name')}>{row.name}</td>
              <td data-label={t('categoryDetail.planned')} className="numeric">
                {formatAmount(row.planned)}
              </td>
              <td data-label={t('categoryDetail.real')} className="numeric">
                {formatAmount(row.real)}
              </td>
              <td data-label={t('categoryDetail.subcategories.progress')}>
                <BudgetProgress spent={row.real} planned={row.planned} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
