import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TOAST_TONE } from '../config/constants';
import { useCategories } from '../hooks/useCategories';
import { useShoppingListItems } from '../hooks/useShoppingListItems';
import { useToast } from '../hooks/useToast';
import { isValidPeriod } from '../utils/dates';
import { requestErrorMessages } from '../utils/errors';
import { formatPeriod } from '../utils/format';
import { logError } from '../utils/logger';
import ShoppingListForm from '../components/shoppingList/ShoppingListForm';
import ShoppingListTable from '../components/shoppingList/ShoppingListTable';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import FormAlert from '../components/ui/FormAlert';
import FormField from '../components/ui/FormField';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/ui/Toast';

// Lista de gastos fijos: lo que se planifica gastar en cada mes, por categoría. Muestra el listado
// y, al lado, el formulario, que sirve para el alta y para editar el ítem elegido en el listado.
// Lo planificado se compara con el consumo real en el resumen de Inicio.
export default function ShoppingListPage() {
  const { t } = useTranslation();
  const listTitleId = useId();
  const formTitleId = useId();
  const listTitleRef = useRef(null);
  const nameFieldRef = useRef(null);
  // El botón Editar de cada fila, por id de ítem: al terminar de editar, el foco vuelve ahí.
  const editButtonsRef = useRef(new Map());
  // El ítem que se está editando, o null si el formulario es de alta.
  const [editing, setEditing] = useState(null);
  // El mes por el que se filtra el listado; vacío, se ven todos los meses.
  const [periodFilter, setPeriodFilter] = useState('');
  const shoppingList = useShoppingListItems();
  const categories = useCategories();
  const notice = useToast();

  // Al elegir una compra para editar, el foco va al formulario (que puede estar más abajo).
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

  async function handleCreate(newItem) {
    await shoppingList.create(newItem);
    notice.show(t('shoppingList.form.created'));
  }

  async function handleUpdate(changes) {
    await shoppingList.update(editing.id, changes);
    stopEditing();
    notice.show(t('shoppingList.form.updated'));
  }

  // El error se avisa acá y no se propaga: ConfirmButton solo vuelve a mostrar el botón. Si sale
  // bien, la fila desaparece y el foco pasa al título del listado para no perderse.
  async function handleDelete(item) {
    try {
      await shoppingList.remove(item.id);
    } catch (error) {
      logError(error);
      notice.show(requestErrorMessages(error, 'shoppingList.list.deleteError', t), {
        tone: TOAST_TONE.ERROR,
      });
      return;
    }
    if (editing?.id === item.id) setEditing(null);
    notice.show(t('shoppingList.list.deleted'));
    listTitleRef.current?.focus();
  }

  const filtering = isValidPeriod(periodFilter);
  const visibleItems = filtering
    ? (shoppingList.items ?? []).filter((item) => item.period === periodFilter)
    : shoppingList.items;

  function renderList() {
    // Se espera también a las categorías: cada fila muestra el nombre de la suya.
    if (shoppingList.isLoading || categories.isLoading) {
      return <LoadingIndicator label={t('shoppingList.list.loading')} />;
    }
    if (shoppingList.error) {
      return (
        <FormAlert
          messages={requestErrorMessages(shoppingList.error, 'shoppingList.list.loadError', t)}
          onRetry={shoppingList.retry}
        />
      );
    }
    if (shoppingList.items.length === 0) {
      return (
        <EmptyState
          headingLevel={3}
          title={t('shoppingList.list.emptyTitle')}
          description={t('shoppingList.list.emptyDescription')}
          action={
            <Button variant="secondary" onClick={() => nameFieldRef.current?.focus()}>
              {t('shoppingList.list.emptyAction')}
            </Button>
          }
        />
      );
    }
    if (visibleItems.length === 0) {
      return (
        <EmptyState
          headingLevel={3}
          title={t('shoppingList.filter.emptyTitle', { period: formatPeriod(periodFilter) })}
          description={t('shoppingList.list.emptyDescription')}
        />
      );
    }
    return (
      <ShoppingListTable
        caption={t('shoppingList.list.caption')}
        items={visibleItems}
        onEdit={setEditing}
        onDelete={handleDelete}
        editButtonRef={registerEditButton}
      />
    );
  }

  function renderForm() {
    if (categories.isLoading) {
      return <LoadingIndicator label={t('shoppingList.form.loadingCategories')} />;
    }
    if (categories.error) {
      return (
        <FormAlert
          messages={requestErrorMessages(categories.error, 'shoppingList.form.categoriesError', t)}
          onRetry={categories.retry}
        />
      );
    }
    // La key vuelve a montar el formulario al pasar de alta a edición o de una compra a otra, para
    // que arranque con los datos de la compra elegida.
    return (
      <ShoppingListForm
        key={editing?.id ?? 'new'}
        categories={categories.categories}
        item={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        onCancel={stopEditing}
        firstFieldRef={nameFieldRef}
        toast={notice}
      />
    );
  }

  return (
    <section className="page">
      <PageHeader eyebrow={t('nav.shoppingList')} title={t('shoppingList.title')} />
      <div className="shopping-list">
        <section aria-labelledby={listTitleId} className="panel">
          <h2 id={listTitleId} ref={listTitleRef} tabIndex={-1}>
            {t('shoppingList.list.title')}
          </h2>
          <p className="muted shopping-list__note">{t('shoppingList.list.note')}</p>
          <div className="shopping-list__filter">
            <FormField
              label={t('shoppingList.filter.label')}
              hint={t('shoppingList.filter.hint')}
              name="periodFilter"
              type="month"
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
            />
          </div>
          {renderList()}
        </section>
        <section aria-labelledby={formTitleId} className="panel shopping-list__form">
          <h2 id={formTitleId}>
            {editing ? t('shoppingList.form.editTitle') : t('shoppingList.form.title')}
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
