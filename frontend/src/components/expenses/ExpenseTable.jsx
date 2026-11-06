import { useTranslation } from 'react-i18next';
import { formatAmount, formatDate, formatPurchaseChannel } from '../../utils/format';
import Button from '../ui/Button';
import ConfirmButton from '../ui/ConfirmButton';

// Listado de gastos en el orden en que llegan. `caption` nombra la tabla para lectores de pantalla.
// - onEdit(expense) se llama al tocar Editar; editButtonRef(id, node) recibe el botón de cada fila
//   (null cuando se va), para que quien llama pueda devolverle el foco.
// - onDelete(expense) se llama recién cuando se confirma el borrado; puede devolver una promesa.
// Si no entra a lo ancho, cada fila se muestra como tarjeta: `data-label` es el rótulo de cada dato.
export default function ExpenseTable({ caption, expenses, onEdit, onDelete, editButtonRef }) {
  const { t } = useTranslation();

  // Cómo se nombra un gasto en los botones y en la pregunta de borrado: la descripción puede faltar.
  function expenseName(expense) {
    const date = formatDate(expense.date);
    return expense.description
      ? t('expenses.list.namedExpense', { description: expense.description, date })
      : t('expenses.list.unnamedExpense', { date });
  }

  return (
    <div className="table-wrapper">
      <table className="data-table data-table--stack-wide">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t('expenses.fields.date')}</th>
            <th scope="col">{t('expenses.fields.description')}</th>
            <th scope="col">{t('expenses.fields.category')}</th>
            <th scope="col">{t('expenses.fields.purchaseChannel')}</th>
            <th scope="col" className="numeric">
              {t('expenses.fields.amount')}
            </th>
            <th scope="col">
              <span className="visually-hidden">{t('expenses.list.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => {
            const name = expenseName(expense);
            return (
              <tr key={expense.id}>
                <td data-label={t('expenses.fields.date')}>
                  <time dateTime={expense.date}>{formatDate(expense.date)}</time>
                </td>
                <td data-label={t('expenses.fields.description')} className="free-text">
                  {/* Un solo hijo: apilada, la celda es una grilla de rótulo y valor. */}
                  <span>
                    {expense.description || (
                      <span className="muted">{t('expenses.list.noDescription')}</span>
                    )}
                    {expense.isFixed && (
                      <>
                        {' '}
                        <span className="badge">{t('expenses.list.fixed')}</span>
                      </>
                    )}
                  </span>
                </td>
                <td data-label={t('expenses.fields.category')}>{expense.category?.name}</td>
                <td data-label={t('expenses.fields.purchaseChannel')}>
                  {expense.purchaseChannel ? (
                    formatPurchaseChannel(expense.purchaseChannel, t)
                  ) : (
                    <span className="muted">{t('expenses.list.noChannel')}</span>
                  )}
                </td>
                <td data-label={t('expenses.fields.amount')} className="numeric">
                  {formatAmount(expense.amount)}
                </td>
                <td>
                  <div className="row-actions">
                    <Button
                      ref={(node) => editButtonRef(expense.id, node)}
                      variant="secondary"
                      aria-label={t('expenses.list.editLabel', { name })}
                      onClick={() => onEdit(expense)}
                    >
                      {t('expenses.list.edit')}
                    </Button>
                    <ConfirmButton
                      aria-label={t('expenses.list.deleteLabel', { name })}
                      question={t('expenses.list.deleteQuestion', { name })}
                      confirmLabel={t('expenses.list.deleteConfirm')}
                      onConfirm={() => onDelete(expense)}
                    >
                      {t('expenses.list.delete')}
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
