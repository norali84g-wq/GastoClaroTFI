import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TOAST_TONE } from '../config/constants';
import { useSavingsGoals } from '../hooks/useSavingsGoals';
import { useToast } from '../hooks/useToast';
import { statusMessage } from '../utils/errors';
import { logError } from '../utils/logger';
import SavingsGoalForm from '../components/savingsGoals/SavingsGoalForm';
import GoalCard from '../components/savingsGoals/GoalCard';
import SavingsGoalTable from '../components/savingsGoals/SavingsGoalTable';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import FormAlert from '../components/ui/FormAlert';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/ui/Toast';

// Sin conexión, el mensaje genérico de red; ante cualquier otro problema, el de esa acción y, si el
// estado HTTP lo explica (sin permiso, no existe), también ese motivo.
function errorMessages(error, messageKey, t) {
  if (error.isNetworkError) return t('errors.network');
  return [t(messageKey), statusMessage(error, t)].filter(Boolean);
}

export default function SavingsGoalsPage() {
  const { t } = useTranslation();
  const listTitleId = useId();
  const formTitleId = useId();
  const listTitleRef = useRef(null);
  const nameFieldRef = useRef(null);
  const savingsGoals = useSavingsGoals();
  const confirmation = useToast();
  // La meta que se está editando; null cuando el formulario es de alta.
  const [editingGoal, setEditingGoal] = useState(null);

  // Al crear se muestra la confirmación y la meta aparece en el listado recién cuando el aviso
  // termina, como en gastos.
  async function handleCreate(newGoal) {
    const goal = await savingsGoals.create(newGoal);
    confirmation.show(t('savingsGoals.messages.created')).then(() => savingsGoals.add(goal));
  }

  async function handleUpdate(changes) {
    const goal = await savingsGoals.update(editingGoal.id, changes);
    savingsGoals.replace(goal);
    setEditingGoal(null);
    confirmation.show(t('savingsGoals.messages.updated'));
  }

  // No falla: un error se registra y se avisa, y la meta queda en el listado (ConfirmButton
  // devuelve el foco a Borrar). Si sale bien, la fila desaparece y el foco pasa al título del
  // listado para no perderse.
  async function handleDelete(goal) {
    try {
      await savingsGoals.destroy(goal.id);
    } catch (error) {
      logError(error);
      confirmation.show(errorMessages(error, 'savingsGoals.messages.deleteError', t), {
        tone: TOAST_TONE.ERROR,
      });
      return;
    }
    savingsGoals.discard(goal.id);
    if (editingGoal?.id === goal.id) setEditingGoal(null);
    confirmation.show(t('savingsGoals.messages.deleted'));
    listTitleRef.current?.focus();
  }

  function renderList() {
    if (savingsGoals.isLoading) {
      return <LoadingIndicator label={t('savingsGoals.list.loading')} />;
    }
    if (savingsGoals.error) {
      return (
        <FormAlert
          messages={errorMessages(savingsGoals.error, 'savingsGoals.list.loadError', t)}
          onRetry={savingsGoals.retry}
        />
      );
    }
    if (savingsGoals.goals.length === 0) {
      return (
        <EmptyState
          headingLevel={3}
          title={t('savingsGoals.list.emptyTitle')}
          description={t('savingsGoals.list.emptyDescription')}
          action={
            <Button variant="secondary" onClick={() => nameFieldRef.current?.focus()}>
              {t('savingsGoals.list.emptyAction')}
            </Button>
          }
        />
      );
    }
    return (
      <SavingsGoalTable
        caption={t('savingsGoals.list.caption')}
        goals={savingsGoals.goals}
        onEdit={setEditingGoal}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <section className="page">
      <PageHeader eyebrow={t('nav.savingsGoals')} title={t('savingsGoals.title')} />
      <p className="page-motto">{t('brand.motto')}</p>
      {savingsGoals.goals?.length > 0 && (
        <ul className="goal-cards goal-cards--page">
          {savingsGoals.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </ul>
      )}
      <div className="dashboard">
        <section aria-labelledby={listTitleId} className="panel">
          <h2 id={listTitleId} ref={listTitleRef} tabIndex={-1}>
            {t('savingsGoals.list.title')}
          </h2>
          {renderList()}
        </section>
        <section aria-labelledby={formTitleId} className="panel dashboard__form">
          <h2 id={formTitleId}>
            {editingGoal ? t('savingsGoals.form.editTitle') : t('savingsGoals.form.createTitle')}
          </h2>
          <SavingsGoalForm
            key={editingGoal?.id ?? 'new'}
            goal={editingGoal}
            onSubmit={editingGoal ? handleUpdate : handleCreate}
            onCancel={() => setEditingGoal(null)}
            firstFieldRef={nameFieldRef}
            toast={confirmation}
          />
        </section>
      </div>
      <Toast
        toast={confirmation.toast}
        onClose={confirmation.close}
        onPause={confirmation.pause}
        onResume={confirmation.resume}
      />
    </section>
  );
}
