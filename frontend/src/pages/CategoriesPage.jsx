import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TOAST_TONE } from '../config/constants';
import { useCategoryManager } from '../hooks/useCategoryManager';
import { useSession } from '../hooks/useSession';
import { useToast } from '../hooks/useToast';
import { requestErrorMessages } from '../utils/errors';
import { logError } from '../utils/logger';
import CategoryForm from '../components/categories/CategoryForm';
import CategoryTable from '../components/categories/CategoryTable';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import FormAlert from '../components/ui/FormAlert';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/ui/Toast';

// Categorías (alimentos, servicios, tarjetas de crédito…): el listado y, al lado, el formulario, que
// sirve para el alta y para editar la categoría elegida. Son compartidas por todos los usuarios, así
// que solo las administra el administrador; la API lo exige y acá se avisa en lugar de mostrarlas.
export default function CategoriesPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const listTitleId = useId();
  const formTitleId = useId();
  const nameFieldRef = useRef(null);
  // El botón Editar de cada fila, por id de categoría: al terminar de editar, el foco vuelve ahí.
  const editButtonsRef = useRef(new Map());
  const [editing, setEditing] = useState(null);
  const manager = useCategoryManager();
  const notice = useToast();

  // Al elegir una categoría para editar, el foco va al formulario (que puede estar más abajo).
  useEffect(() => {
    if (editing) nameFieldRef.current?.focus();
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

  async function handleCreate(newCategory) {
    await manager.create(newCategory);
    notice.show(t('categories.form.created'));
  }

  async function handleUpdate(changes) {
    await manager.update(editing.id, changes);
    stopEditing();
    notice.show(t('categories.form.updated'));
  }

  // El error se avisa acá y no se propaga: ConfirmButton solo vuelve a mostrar el botón. Si la API
  // no la borra (tiene gastos, por ejemplo), se muestra su motivo.
  async function handleDelete(category) {
    try {
      await manager.remove(category.id);
    } catch (error) {
      logError(error);
      const reason = error.status === 422 ? error.errors?.[0]?.message : null;
      notice.show(
        [...requestErrorMessages(error, 'categories.list.deleteError', t), reason].filter(Boolean),
        { tone: TOAST_TONE.ERROR },
      );
      return;
    }
    if (editing?.id === category.id) setEditing(null);
    notice.show(t('categories.list.deleted'));
  }

  function renderList() {
    if (manager.isLoading) return <LoadingIndicator label={t('categories.list.loading')} />;
    if (manager.error) {
      return (
        <FormAlert
          messages={requestErrorMessages(manager.error, 'categories.list.loadError', t)}
          onRetry={manager.retry}
        />
      );
    }
    if (manager.categories.length === 0) {
      return (
        <EmptyState
          headingLevel={3}
          title={t('categories.list.emptyTitle')}
          description={t('categories.list.emptyDescription')}
          action={
            <Button variant="secondary" onClick={() => nameFieldRef.current?.focus()}>
              {t('categories.list.emptyAction')}
            </Button>
          }
        />
      );
    }
    return (
      <CategoryTable
        caption={t('categories.list.caption')}
        categories={manager.categories}
        onEdit={setEditing}
        onDelete={handleDelete}
        editButtonRef={registerEditButton}
      />
    );
  }

  if (!user?.admin) {
    return (
      <section className="page">
        <PageHeader eyebrow={t('nav.categories')} title={t('categories.title')} />
        <p role="alert">{t('categories.adminOnly')}</p>
      </section>
    );
  }

  return (
    <section className="page">
      <PageHeader eyebrow={t('nav.categories')} title={t('categories.title')} />
      <div className="dashboard">
        <section aria-labelledby={listTitleId} className="panel">
          <h2 id={listTitleId}>{t('categories.list.title')}</h2>
          <p className="muted">{t('categories.list.note')}</p>
          {renderList()}
        </section>
        <section aria-labelledby={formTitleId} className="panel dashboard__form">
          <h2 id={formTitleId}>
            {editing ? t('categories.form.editTitle') : t('categories.form.title')}
          </h2>
          {manager.categories ? (
            <CategoryForm
              key={editing?.id ?? 'new'}
              categories={manager.categories}
              category={editing}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={stopEditing}
              firstFieldRef={nameFieldRef}
              toast={notice}
            />
          ) : null}
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
