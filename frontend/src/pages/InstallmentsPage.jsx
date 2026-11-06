import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TOAST_TONE } from '../config/constants';
import { useCategories } from '../hooks/useCategories';
import { useInstallmentPurchases } from '../hooks/useInstallmentPurchases';
import { useToast } from '../hooks/useToast';
import { requestErrorMessages } from '../utils/errors';
import { logError } from '../utils/logger';
import InstallmentForm from '../components/installments/InstallmentForm';
import InstallmentSummary from '../components/installments/InstallmentSummary';
import InstallmentTable from '../components/installments/InstallmentTable';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import FormAlert from '../components/ui/FormAlert';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/ui/Toast';

// Compras en cuotas: el listado y, debajo, el formulario, que sirve para el alta y para editar la
// compra elegida en el listado. Las cuotas no crean consumo, así que nada de esta pantalla vuelve a
// pedir el resumen del panel.
export default function InstallmentsPage() {
  const { t } = useTranslation();
  const listTitleId = useId();
  const formTitleId = useId();
  const listTitleRef = useRef(null);
  const descriptionFieldRef = useRef(null);
  // El botón Editar de cada fila, por id de compra: al terminar de editar, el foco vuelve ahí.
  const editButtonsRef = useRef(new Map());
  // La compra que se está editando, o null si el formulario es de alta.
  const [editing, setEditing] = useState(null);
  const installments = useInstallmentPurchases();
  const categories = useCategories();
  const notice = useToast();

  // Al elegir una compra para editar, el foco va al formulario (que puede estar más abajo).
  useEffect(() => {
    if (editing) descriptionFieldRef.current?.focus();
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

  async function handleCreate(newPurchase) {
    await installments.create(newPurchase);
    notice.show(t('installments.form.created'));
  }

  async function handleUpdate(changes) {
    await installments.update(editing.id, changes);
    stopEditing();
    notice.show(t('installments.form.updated'));
  }

  // El error se avisa acá y no se propaga: ConfirmButton solo vuelve a mostrar el botón. Si sale
  // bien, la fila desaparece y el foco pasa al título del listado para no perderse.
  async function handleDelete(purchase) {
    try {
      await installments.remove(purchase.id);
    } catch (error) {
      logError(error);
      notice.show(requestErrorMessages(error, 'installments.list.deleteError', t), {
        tone: TOAST_TONE.ERROR,
      });
      return;
    }
    if (editing?.id === purchase.id) setEditing(null);
    notice.show(t('installments.list.deleted'));
    listTitleRef.current?.focus();
  }

  function renderList() {
    // Se espera también a las categorías: cada fila muestra el nombre de la suya.
    if (installments.isLoading || categories.isLoading) {
      return <LoadingIndicator label={t('installments.list.loading')} />;
    }
    if (installments.error) {
      return (
        <FormAlert
          messages={requestErrorMessages(installments.error, 'installments.list.loadError', t)}
          onRetry={installments.retry}
        />
      );
    }
    if (installments.purchases.length === 0) {
      return (
        <EmptyState
          headingLevel={3}
          title={t('installments.list.emptyTitle')}
          description={t('installments.list.emptyDescription')}
          action={
            <Button variant="secondary" onClick={() => descriptionFieldRef.current?.focus()}>
              {t('installments.list.emptyAction')}
            </Button>
          }
        />
      );
    }
    return (
      <>
        <InstallmentSummary
          purchases={installments.purchases}
          categories={categories.categories ?? []}
        />
        <InstallmentTable
          caption={t('installments.list.caption')}
          purchases={installments.purchases}
          categories={categories.categories ?? []}
          onEdit={setEditing}
          onDelete={handleDelete}
          editButtonRef={registerEditButton}
        />
      </>
    );
  }

  function renderForm() {
    if (categories.isLoading) {
      return <LoadingIndicator label={t('installments.form.loadingCategories')} />;
    }
    if (categories.error) {
      return (
        <FormAlert
          messages={requestErrorMessages(categories.error, 'installments.form.categoriesError', t)}
          onRetry={categories.retry}
        />
      );
    }
    // La key vuelve a montar el formulario al pasar de alta a edición o de una compra a otra, para
    // que arranque con los datos de la compra elegida.
    // Las compras en cuotas se cargan en las tarjetas (las categorías marcadas así). Al editar una
    // compra de otra categoría, esa categoría sigue disponible para no perderla.
    const cards = categories.categories.filter(
      ({ id, tracksInstallments }) => tracksInstallments || id === editing?.categoryId,
    );
    return (
      <InstallmentForm
        key={editing?.id ?? 'new'}
        categories={cards}
        purchase={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        onCancel={stopEditing}
        firstFieldRef={descriptionFieldRef}
        toast={notice}
      />
    );
  }

  return (
    <section className="page">
      <PageHeader eyebrow={t('nav.installments')} title={t('installments.title')} />
      <p className="notice">{t('installments.notIncluded')}</p>
      <div className="installments">
        <section aria-labelledby={listTitleId} className="panel">
          <h2 id={listTitleId} ref={listTitleRef} tabIndex={-1}>
            {t('installments.list.title')}
          </h2>
          <p className="muted installments__note">{t('installments.list.note')}</p>
          {renderList()}
        </section>
        <section aria-labelledby={formTitleId} className="panel installments__form">
          <h2 id={formTitleId}>
            {editing ? t('installments.form.editTitle') : t('installments.form.title')}
          </h2>
          {renderForm()}
        </section>
      </div>
      <Toast
        toast={notice.toast}
        onClose={notice.close}
        onPause={notice.pause}
        onResume={notice.resume}
      />
    </section>
  );
}
