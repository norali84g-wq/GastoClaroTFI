import { useTranslation } from 'react-i18next';
import { formatAmount, formatShortPeriod } from '../../utils/format';
import Button from '../ui/Button';
import ConfirmButton from '../ui/ConfirmButton';

// Listado de compras en cuotas en el orden en que llegan. `caption` nombra la tabla para lectores de
// pantalla. La compra trae solo el id de su categoría: el nombre sale de `categories`.
// - onEdit(purchase) se llama al tocar Editar; editButtonRef(id, node) recibe el botón de cada
//   fila (null cuando se va), para que quien llama pueda devolverle el foco.
// - onDelete(purchase) se llama recién cuando se confirma el borrado; puede devolver una promesa.
// Tiene muchas columnas numéricas: si no entra a lo ancho, cada fila se muestra como tarjeta.
export default function InstallmentTable({
  caption,
  purchases,
  categories,
  onEdit,
  onDelete,
  editButtonRef,
}) {
  const { t } = useTranslation();
  const categoryNames = new Map(categories.map(({ id, name }) => [id, name]));

  return (
    <div className="table-wrapper">
      <table className="data-table data-table--stack-wide">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t('installments.fields.description')}</th>
            <th scope="col">{t('installments.fields.category')}</th>
            <th scope="col">{t('installments.fields.firstPeriod')}</th>
            <th scope="col" className="numeric">
              {t('installments.fields.totalAmount')}
            </th>
            <th scope="col" className="numeric">
              {t('installments.fields.installmentAmount')}
            </th>
            <th scope="col" className="numeric">
              {t('installments.fields.remainingInstallments')}
            </th>
            <th scope="col">
              <span className="visually-hidden">{t('installments.list.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => {
            const { description } = purchase;
            const categoryName = categoryNames.get(purchase.categoryId);
            return (
              <tr key={purchase.id}>
                <td data-label={t('installments.fields.description')} className="free-text">
                  {description}
                </td>
                <td data-label={t('installments.fields.category')}>
                  {categoryName ?? (
                    <span className="muted">{t('installments.list.unknownCategory')}</span>
                  )}
                </td>
                <td data-label={t('installments.fields.firstPeriod')}>
                  <time dateTime={purchase.firstPeriod}>
                    {formatShortPeriod(purchase.firstPeriod)}
                  </time>
                </td>
                <td data-label={t('installments.fields.totalAmount')} className="numeric">
                  {formatAmount(purchase.totalAmount)}
                </td>
                <td data-label={t('installments.fields.installmentAmount')} className="numeric">
                  {formatAmount(purchase.installmentAmount)}
                </td>
                <td data-label={t('installments.fields.remainingInstallments')} className="numeric">
                  {t('installments.list.remaining', {
                    remaining: purchase.remainingInstallments,
                    count: purchase.installmentsCount,
                  })}
                </td>
                <td>
                  <div className="row-actions">
                    <Button
                      ref={(node) => editButtonRef(purchase.id, node)}
                      variant="secondary"
                      aria-label={t('installments.list.editLabel', { description })}
                      onClick={() => onEdit(purchase)}
                    >
                      {t('installments.list.edit')}
                    </Button>
                    <ConfirmButton
                      aria-label={t('installments.list.deleteLabel', { description })}
                      question={t('installments.list.deleteQuestion', { description })}
                      confirmLabel={t('installments.list.deleteConfirm')}
                      onConfirm={() => onDelete(purchase)}
                    >
                      {t('installments.list.delete')}
                    </ConfirmButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
