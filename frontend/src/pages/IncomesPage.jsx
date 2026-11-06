import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TOAST_TONE } from '../config/constants';
import { useIncomes } from '../hooks/useIncomes';
import { useToast } from '../hooks/useToast';
import { requestErrorMessages } from '../utils/errors';
import { logError } from '../utils/logger';
import IncomeForm from '../components/incomes/IncomeForm';
import IncomeTable from '../components/incomes/IncomeTable';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import FormAlert from '../components/ui/FormAlert';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/ui/Toast';

// Ingresos: el listado y, al lado, el formulario, que sirve para el alta y para editar el ingreso
// elegido en el listado.
export default function IncomesPage() {
  const { t } = useTranslation();
  const listTitleId = useId();
  const formTitleId = useId();
  const listTitleRef = useRef(null);
  const dateFieldRef = useRef(null);
  // El botón Editar de cada fila, por id de ingreso: al terminar de editar, el foco vuelve ahí.
  const editButtonsRef = useRef(new Map());
  // El ingreso que se está editando, o null si el formulario es de alta.
  const [editing, setEditing] = useState(null);
  const incomes = useIncomes();
  const confirmation = useToast();

  // Al elegir un ingreso para editar, el foco va al formulario (que puede estar más abajo).
  useEffect(() => {
    if (editing) dateFieldRef.current?.focus();
  }, [editing]);

  function registerEditButton(id, node) {
    if (node) editButtonsRef.current.set(id, node);
    else editButtonsRef.current.delete(id);
  }

  function stopEditing() {
    const { id } = editing;
    setEditing(null);
    editButtonsRef.current.get(id)?.focus();
  }

  // Al guardar se muestra la confirmación, y el ingreso aparece en el listado recién cuando el aviso
  // termina.
  async function handleCreate(newIncome) {
    const income = await incomes.create(newIncome);
    confirmation.show(t('incomes.form.success')).then(() => incomes.add(income));
  }

  async function handleUpdate(changes) {
    await incomes.update(editing.id, changes);
    stopEditing();
    confirmation.show(t('incomes.form.updated'));
  }

  // El error se avisa acá y no se propaga: ConfirmButton solo vuelve a mostrar el botón. Si sale
  // bien, la fila desaparece y el foco pasa al título del listado para no perderse.
  async function handleDelete(income) {
    try {
      await incomes.remove(income.id);
    } catch (error) {
      logError(error);
      confirmation.show(requestErrorMessages(error, 'incomes.list.deleteError', t), {
        tone: TOAST_TONE.ERROR,
      });
      return;
    }
    if (editing?.id === income.id) setEditing(null);
    confirmation.show(t('incomes.list.deleted'));
    listTitleRef.current?.focus();
  }

  function renderList() {
    if (incomes.isLoading) return <LoadingIndicator label={t('incomes.list.loading')} />;
    if (incomes.error) {
      return (
        <FormAlert
          messages={requestErrorMessages(incomes.error, 'incomes.list.loadError', t)}
          onRetry={incomes.retry}
        />
      );
    }
    if (incomes.incomes.length === 0) {
      return (
        <EmptyState
          headingLevel={3}
          title={t('incomes.list.emptyTitle')}
          description={t('incomes.list.emptyDescription')}
          action={
            <Button variant="secondary" onClick={() => dateFieldRef.current?.focus()}>
              {t('incomes.list.emptyAction')}
            </Button>
          }
        />
      );
    }
    return (
      <IncomeTable
        caption={t('incomes.list.caption')}
        incomes={incomes.incomes}
        onEdit={setEditing}
        onDelete={handleDelete}
        editButtonRef={registerEditButton}
      />
    );
  }

  return (
    <section className="page">
      <PageHeader eyebrow={t('nav.incomes')} title={t('incomes.title')} />
      <div className="dashboard">
        <section aria-labelledby={listTitleId} className="panel">
          <h2 id={listTitleId} ref={listTitleRef} tabIndex={-1}>
            {t('incomes.list.title')}
          </h2>
          {renderList()}
        </section>
        <section aria-labelledby={formTitleId} className="panel dashboard__form">
          <h2 id={formTitleId}>
            {editing ? t('incomes.form.editTitle') : t('incomes.form.title')}
          </h2>
          {/* La key vuelve a montar el formulario al pasar de alta a edición o de un ingreso a otro,
              para que arranque con los datos del ingreso elegido. */}
          <IncomeForm
            key={editing?.id ?? 'new'}
            income={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={stopEditing}
            firstFieldRef={dateFieldRef}
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
