import { useTranslation } from 'react-i18next';
import { formatAmount, formatShortPeriod } from '../../utils/format';
import Button from '../ui/Button';
import ConfirmButton from '../ui/ConfirmButton';

// Listado de la lista de gastos fijos en el orden en que llega. `caption` nombra la tabla para
// lectores de pantalla. Si no entra a lo ancho, cada fila se muestra como tarjeta.
// - onEdit(item) se llama al tocar Editar; editButtonRef(id, node) recibe el botón de cada fila
//   (null cuando se va), para que quien llama pueda devolverle el foco.
// - onDelete(item) se llama recién cuando se confirma el borrado; puede devolver una promesa.
export default function ShoppingListTable({ caption, items, onEdit, onDelete, editButtonRef }) {
  const { t } = useTranslation();

  return (
    <div className="table-wrapper">
      <table className="data-table data-table--stack-wide">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t('shoppingList.fields.period')}</th>
            <th scope="col">{t('shoppingList.fields.name')}</th>
            <th scope="col">{t('shoppingList.fields.category')}</th>
            <th scope="col" className="numeric">
              {t('shoppingList.fields.quantity')}
            </th>
            <th scope="col" className="numeric">
              {t('shoppingList.fields.estimatedUnitPrice')}
            </th>
            <th scope="col" className="numeric">
              {t('shoppingList.fields.subtotal')}
            </th>
            <th scope="col">
              <span className="visually-hidden">{t('shoppingList.list.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const { name } = item;
            return (
              <tr key={item.id}>
                <td data-label={t('shoppingList.fields.period')}>
                  <time dateTime={item.period}>{formatShortPeriod(item.period)}</time>
                </td>
                <td data-label={t('shoppingList.fields.name')} className="free-text">
                  {name}
                </td>
                <td data-label={t('shoppingList.fields.category')}>
                  {item.categoryName ?? (
                    <span className="muted">{t('shoppingList.list.unknownCategory')}</span>
                  )}
                </td>
                <td data-label={t('shoppingList.fields.quantity')} className="numeric">
                  {item.quantity ?? (
                    <span className="muted">{t('shoppingList.list.noQuantity')}</span>
                  )}
                </td>
                <td data-label={t('shoppingList.fields.estimatedUnitPrice')} className="numeric">
                  {formatAmount(item.estimatedUnitPrice)}
                </td>
                <td data-label={t('shoppingList.fields.subtotal')} className="numeric">
                  {formatAmount(item.subtotal)}
                </td>
                <td>
                  <div className="row-actions">
                    <Button
                      ref={(node) => editButtonRef(item.id, node)}
                      variant="secondary"
                      aria-label={t('shoppingList.list.editLabel', { name })}
                      onClick={() => onEdit(item)}
                    >
                      {t('shoppingList.list.edit')}
                    </Button>
                    <ConfirmButton
                      aria-label={t('shoppingList.list.deleteLabel', { name })}
                      question={t('shoppingList.list.deleteQuestion', { name })}
                      confirmLabel={t('shoppingList.list.deleteConfirm')}
                      onConfirm={() => onDelete(item)}
                    >
                      {t('shoppingList.list.delete')}
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
