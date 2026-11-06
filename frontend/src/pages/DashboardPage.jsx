import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HTTP_STATUS, TOAST_TONE } from '../config/constants';
import { useCategories } from '../hooks/useCategories';
import { useDashboard } from '../hooks/useDashboard';
import { useExpenses } from '../hooks/useExpenses';
import { useSavingsGoals } from '../hooks/useSavingsGoals';
import { useToast } from '../hooks/useToast';
import { currentPeriod, isValidPeriod, periodOf } from '../utils/dates';
import { requestErrorMessages } from '../utils/errors';
import { formatPeriod } from '../utils/format';
import { logError } from '../utils/logger';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import FeaturedGoals from '../components/dashboard/FeaturedGoals';
import MottoBanner from '../components/dashboard/MottoBanner';
import GreetingBanner from '../components/dashboard/GreetingBanner';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseTable from '../components/expenses/ExpenseTable';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import FormAlert from '../components/ui/FormAlert';
import FormField from '../components/ui/FormField';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/ui/Toast';

// `expensesOnly` es la pantalla de Consumos: el mismo listado y formulario de gastos, sin el resumen
// del mes. Sin él, es Inicio: el resumen y, debajo, los gastos.
export default function DashboardPage({ expensesOnly = false }) {
  const { t } = useTranslation();
  const summaryTitleId = useId();
  const listTitleId = useId();
  const formTitleId = useId();
  const listTitleRef = useRef(null);
  const dateFieldRef = useRef(null);
  // El botón Editar de cada fila, por id de gasto: al terminar de editar, el foco vuelve ahí.
  const editButtonsRef = useRef(new Map());
  // La app es mensual: arranca en el mes en curso. `periodInput` es lo que está escrito en el
  // filtro (en navegadores sin selector de mes es texto libre); `period`, el último mes válido.
  const [period, setPeriod] = useState(currentPeriod);
  const [periodInput, setPeriodInput] = useState(period);
  // El gasto que se está editando, o null si el formulario es de alta.
  const [editing, setEditing] = useState(null);
  const expenses = useExpenses(period);
  const categories = useCategories();
  const dashboard = useDashboard();
  const savingsGoals = useSavingsGoals();
  const confirmation = useToast();

  // Al elegir un gasto para editar, el foco va al formulario (que puede estar más abajo).
  useEffect(() => {
    if (editing) dateFieldRef.current?.focus();
  }, [editing]);

  function changePeriod(value) {
    setPeriodInput(value);
    if (isValidPeriod(value)) setPeriod(value);
  }

  function registerEditButton(id, node) {
    if (node) editButtonsRef.current.set(id, node);
    else editButtonsRef.current.delete(id);
  }

  // Vuelve al alta. El foco va al Editar del gasto, si sigue en el listado, o al título del listado.
  function stopEditing({ stillListed = true } = {}) {
    const { id } = editing;
    setEditing(null);
    const button = stillListed ? editButtonsRef.current.get(id) : null;
    (button ?? listTitleRef.current)?.focus();
  }

  // El gasto ya no existe o no es del usuario (404): se avisa, se deja de editar y se vuelve a pedir
  // el listado para que no quede a la vista.
  function handleMissingExpense(error) {
    logError(error);
    setEditing(null);
    confirmation.show(t('expenses.missing'), { tone: TOAST_TONE.ERROR });
    expenses.retry();
    dashboard.retry();
    listTitleRef.current?.focus();
  }

  // Al guardar se muestra la confirmación, y el gasto aparece recién cuando el aviso termina:
  // entonces se suma al listado y el filtro pasa a su mes, para que se vea dónde quedó. El resumen
  // se vuelve a pedir siempre: un gasto de un mes anterior también cambia la evolución de los 6
  // meses.
  async function handleCreate(newExpense) {
    const expense = await expenses.create(newExpense);
    confirmation.show(t('expenses.form.success')).then(() => {
      expenses.add(expense);
      changePeriod(periodOf(expense.date));
      dashboard.retry();
    });
  }

  // Al editar, el listado cambia enseguida (si el gasto pasó a otro mes, sale de este) y el resumen
  // se vuelve a pedir. Un 422 lo muestra el formulario en sus campos; un 404, esta pantalla.
  async function handleUpdate(changes) {
    let expense;
    try {
      expense = await expenses.update(editing.id, changes);
    } catch (error) {
      if (error?.status !== HTTP_STATUS.NOT_FOUND) throw error;
      handleMissingExpense(error);
      return;
    }
    stopEditing({ stillListed: periodOf(expense.date) === period });
    confirmation.show(t('expenses.form.updated'));
    dashboard.retry();
  }

  // El error se avisa acá y no se propaga: ConfirmButton solo vuelve a mostrar el botón. Si sale
  // bien, la fila desaparece y el foco pasa al título del listado para no perderse.
  async function handleDelete(expense) {
    try {
      await expenses.remove(expense.id);
    } catch (error) {
      if (error?.status === HTTP_STATUS.NOT_FOUND) {
        handleMissingExpense(error);
        return;
      }
      logError(error);
      confirmation.show(requestErrorMessages(error, 'expenses.list.deleteError', t), {
        tone: TOAST_TONE.ERROR,
      });
      return;
    }
    if (editing?.id === expense.id) setEditing(null);
    confirmation.show(t('expenses.list.deleted'));
    dashboard.retry();
    listTitleRef.current?.focus();
  }

  function renderSummary() {
    if (dashboard.isLoading) return <LoadingIndicator label={t('dashboard.summary.loading')} />;
    if (dashboard.error) {
      return (
        <FormAlert
          messages={requestErrorMessages(dashboard.error, 'dashboard.summary.loadError', t)}
          onRetry={dashboard.retry}
        />
      );
    }
    return <DashboardSummary summary={dashboard.summary} goals={savingsGoals.goals} />;
  }

  function renderList() {
    if (expenses.isLoading) return <LoadingIndicator label={t('expenses.list.loading')} />;
    if (expenses.error) {
      return (
        <FormAlert
          messages={requestErrorMessages(expenses.error, 'expenses.list.loadError', t)}
          onRetry={expenses.retry}
        />
      );
    }
    if (expenses.expenses.length === 0) {
      return (
        <EmptyState
          headingLevel={3}
          title={t('expenses.list.emptyTitle', { period: formatPeriod(period) })}
          description={t('expenses.list.emptyDescription')}
          action={
            <Button variant="secondary" onClick={() => dateFieldRef.current?.focus()}>
              {t('expenses.list.emptyAction')}
            </Button>
          }
        />
      );
    }
    return (
      <ExpenseTable
        caption={t('expenses.list.caption', { period: formatPeriod(period) })}
        expenses={expenses.expenses}
        onEdit={setEditing}
        onDelete={handleDelete}
        editButtonRef={registerEditButton}
      />
    );
  }

  function renderForm() {
    if (categories.isLoading)
      return <LoadingIndicator label={t('expenses.form.loadingCategories')} />;
    if (categories.error) {
      return (
        <FormAlert
          messages={requestErrorMessages(categories.error, 'expenses.form.categoriesError', t)}
          onRetry={categories.retry}
        />
      );
    }
    // La key vuelve a montar el formulario al pasar de alta a edición o de un gasto a otro, para
    // que arranque con los datos del gasto elegido.
    return (
      <ExpenseForm
        key={editing?.id ?? 'new'}
        categories={categories.categories}
        expense={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        onCancel={() => stopEditing()}
        firstFieldRef={dateFieldRef}
        toast={confirmation}
      />
    );
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow={expensesOnly ? t('nav.expenses') : t('nav.dashboard')}
        title={expensesOnly ? t('expenses.title') : t('dashboard.title')}
      />
      {!expensesOnly && <GreetingBanner />}
      {!expensesOnly && (
        <section aria-labelledby={summaryTitleId} className="dashboard-summary">
          <h2 id={summaryTitleId}>{t('dashboard.summary.title')}</h2>
          {renderSummary()}
        </section>
      )}
      {!expensesOnly && <FeaturedGoals goals={savingsGoals.goals} />}
      <div className="dashboard">
        <section aria-labelledby={listTitleId} className="panel">
          <h2 id={listTitleId} ref={listTitleRef} tabIndex={-1}>
            {t('expenses.list.title')}
          </h2>
          <div className="dashboard__filter">
            <FormField
              label={t('expenses.filter.label')}
              name="period"
              type="month"
              placeholder={t('expenses.filter.placeholder')}
              value={periodInput}
              onChange={(event) => changePeriod(event.target.value)}
              errors={isValidPeriod(periodInput) ? undefined : t('expenses.filter.invalid')}
            />
          </div>
          {renderList()}
        </section>
        <section aria-labelledby={formTitleId} className="panel dashboard__form">
          <h2 id={formTitleId}>
            {editing ? t('expenses.form.editTitle') : t('expenses.form.title')}
          </h2>
          {renderForm()}
        </section>
      </div>
      {!expensesOnly && <MottoBanner />}
      <Toast
        toast={confirmation.toast}
        onClose={confirmation.close}
        onPause={confirmation.pause}
        onResume={confirmation.resume}
      />
    </section>
  );
}
