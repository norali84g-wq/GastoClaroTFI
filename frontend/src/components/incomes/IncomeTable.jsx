import { useTranslation } from 'react-i18next';
import { formatAmount, formatDate } from '../../utils/format';
import Button from '../ui/Button';
import ConfirmButton from '../ui/ConfirmButton';

// Listado de ingresos en el orden en que llegan. `caption` nombra la tabla para lectores de
// pantalla. Si no entra a lo ancho, cada fila se muestra como tarjeta: `data-label` es el rótulo de
// cada dato.
// - onEdit(income) se llama al tocar Editar; editButtonRef(id, node) recibe el botón de cada fila
//   (null cuando se va), para que quien llama pueda devolverle el foco.
// - onDelete(income) se llama recién cuando se confirma el borrado; puede devolver una promesa.
export default function IncomeTable({ caption, incomes, onEdit, onDelete, editButtonRef }) {
  const { t } = useTranslation();

  return (
    <div className="table-wrapper">
      <table className="data-table data-table--stack">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t('incomes.fields.date')}</th>
            <th scope="col" className="numeric">
              {t('incomes.fields.amount')}
            </th>
            <th scope="col">
              <span className="visually-hidden">{t('incomes.list.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {incomes.map((income) => {
            // Cómo se nombra el ingreso en los botones y en la pregunta de borrado.
            const name = t('incomes.list.incomeName', {
              amount: formatAmount(income.amount),
              date: formatDate(income.date),
            });
            return (
              <tr key={income.id}>
                <td data-label={t('incomes.fields.date')}>
                  <time dateTime={income.date}>{formatDate(income.date)}</time>
                </td>
                <td data-label={t('incomes.fields.amount')} className="numeric">
                  {formatAmount(income.amount)}
                </td>
                <td>
                  <div className="row-actions">
                    <Button
                      ref={(node) => editButtonRef(income.id, node)}
                      variant="secondary"
                      aria-label={t('incomes.list.editLabel', { name })}
                      onClick={() => onEdit(income)}
                    >
                      {t('incomes.list.edit')}
                    </Button>
                    <ConfirmButton
                      aria-label={t('incomes.list.deleteLabel', { name })}
                      question={t('incomes.list.deleteQuestion', { name })}
                      confirmLabel={t('incomes.list.deleteConfirm')}
                      onConfirm={() => onDelete(income)}
                    >
                      {t('incomes.list.delete')}
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
