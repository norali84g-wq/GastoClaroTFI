import { useTranslation } from 'react-i18next';
import { formatAmount, formatDate, formatPercentage } from '../../utils/format';
import Button from '../ui/Button';
import ConfirmButton from '../ui/ConfirmButton';

// Listado de metas en el orden en que llegan. `caption` nombra la tabla para lectores de pantalla.
// Si no entra a lo ancho, cada fila se muestra como tarjeta: `data-label` es el rótulo de cada dato.
// Lo ahorrado y el objetivo van en columnas separadas: juntos en una celda de montos (que no se
// parte) no entran con montos largos. onEdit(goal) y onDelete(goal) los resuelve quien llama;
// onDelete se llama recién cuando se confirma el borrado y devuelve una promesa que no falla
// (maneja sus propios errores).
export default function SavingsGoalTable({ caption, goals, onEdit, onDelete }) {
  const { t } = useTranslation();

  return (
    <div className="table-wrapper">
      <table className="data-table data-table--stack-wide">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t('savingsGoals.fields.name')}</th>
            <th scope="col">{t('savingsGoals.fields.deadline')}</th>
            <th scope="col" className="numeric">
              {t('savingsGoals.fields.savedAmount')}
            </th>
            <th scope="col" className="numeric">
              {t('savingsGoals.fields.targetAmount')}
            </th>
            <th scope="col" className="numeric">
              {t('savingsGoals.fields.progress')}
            </th>
            <th scope="col">
              <span className="visually-hidden">{t('savingsGoals.fields.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {goals.map((goal) => (
            <tr key={goal.id}>
              <td data-label={t('savingsGoals.fields.name')} className="free-text">
                <span>{goal.name}</span>
              </td>
              <td data-label={t('savingsGoals.fields.deadline')}>
                {goal.deadline ? (
                  <time dateTime={goal.deadline}>{formatDate(goal.deadline)}</time>
                ) : (
                  <span className="muted">{t('savingsGoals.list.noDeadline')}</span>
                )}
              </td>
              <td data-label={t('savingsGoals.fields.savedAmount')} className="numeric">
                {formatAmount(goal.savedAmount)}
              </td>
              <td data-label={t('savingsGoals.fields.targetAmount')} className="numeric">
                {formatAmount(goal.targetAmount)}
              </td>
              <td data-label={t('savingsGoals.fields.progress')} className="numeric">
                {formatPercentage(goal.progressPercentage / 100)}
              </td>
              <td>
                <div className="row-actions">
                  <Button
                    variant="secondary"
                    aria-label={t('savingsGoals.list.editLabel', { name: goal.name })}
                    onClick={() => onEdit(goal)}
                  >
                    {t('savingsGoals.list.edit')}
                  </Button>
                  <ConfirmButton
                    aria-label={t('savingsGoals.list.deleteLabel', { name: goal.name })}
                    question={t('savingsGoals.list.confirmDelete', { name: goal.name })}
                    confirmLabel={t('savingsGoals.list.confirmYes')}
                    onConfirm={() => onDelete(goal)}
                  >
                    {t('savingsGoals.list.delete')}
                  </ConfirmButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
