import { useTranslation } from 'react-i18next';
import { AMOUNT_MAX_DECIMALS, PURCHASE_CHANNELS } from '../../config/constants';
import { useForm } from '../../hooks/useForm';
import { todayISO } from '../../utils/dates';
import { formatAmount, formatPurchaseChannel } from '../../utils/format';
import {
  itemErrorKey,
  itemsTotal,
  remainingItems,
  toExpenseChanges,
  toExpenseFormValues,
  toNewExpense,
  validateExpense,
} from '../../validation/expenses';
import Button from '../ui/Button';
import FormAlert from '../ui/FormAlert';
import FormField from '../ui/FormField';
import LoadingIndicator from '../ui/LoadingIndicator';
import ExpenseItemsFields from './ExpenseItemsFields';

// Nombres de campo de la API que no coinciden con los del formulario. La API no dice a qué ítem
// corresponde un error de ítem, así que esos van juntos arriba de los ítems.
const API_FIELDS = {
  category_id: 'categoryId',
  is_fixed: 'isFixed',
  purchase_channel: 'purchaseChannel',
  'expense_items.name': 'items',
  'expense_items.quantity': 'items',
  'expense_items.unit': 'items',
  'expense_items.unit_price': 'items',
};

const ITEM_FIELDS = ['name', 'quantity', 'unit', 'unitPrice'];

function emptyValues() {
  return {
    date: todayISO(),
    categoryId: '',
    amount: '',
    description: '',
    isFixed: false,
    purchaseChannel: '',
  };
}

// Alta o edición de un gasto. onSubmit recibe el gasto con amount y categoryId como números.
// - Sin `expense`, es un alta: después de guardar se vacía y el foco vuelve a `firstFieldRef` para
//   cargar otro.
// - Con `expense`, arranca con sus datos y ofrece cancelar (onCancel). Si el gasto tiene ítems, se
//   pueden modificar o quitar; mientras quede alguno, el monto es su suma y no se escribe. onSubmit
//   recibe también los ítems (ver toExpenseChanges). Para pasar de un gasto a otro, quien llama lo
//   vuelve a montar (con `key`).
// Sin categorías no se puede guardar: el campo lo explica y el botón queda deshabilitado.
// `firstFieldRef` permite llevar el foco al formulario desde afuera. La confirmación la muestra
// quien llama; los errores generales de la API (field "base") se avisan en `toast` (lo que
// devuelve useToast), si se pasa.
export default function ExpenseForm({
  categories,
  expense,
  onSubmit,
  onCancel,
  firstFieldRef,
  toast,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(expense);
  const hasCategories = categories.length > 0;
  const {
    values,
    fieldErrors,
    formErrors,
    isNetworkError,
    isSubmitting,
    handleChange,
    setFieldValue,
    handleSubmit,
    retry,
    formRef,
    alertRef,
  } = useForm({
    initialValues: isEditing ? toExpenseFormValues(expense) : emptyValues(),
    validate: (formValues) => validateExpense(formValues, t),
    onSubmit: (formValues) =>
      onSubmit(isEditing ? toExpenseChanges(formValues) : toNewExpense(formValues)),
    apiFields: API_FIELDS,
    resetOnSuccess: !isEditing,
    successFocusRef: isEditing ? undefined : firstFieldRef,
    toast,
  });
  const hasItems = isEditing && values.items.length > 0;
  const amountFromItems = hasItems && remainingItems(values.items).length > 0;

  function changeItem(index, field, value) {
    const items = values.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    setFieldValue('items', items, [itemErrorKey(index, field), 'items']);
  }

  function setItemRemoved(index, removed) {
    const items = values.items.map((item, i) => (i === index ? { ...item, removed } : item));
    const keys = ITEM_FIELDS.map((field) => itemErrorKey(index, field));
    setFieldValue('items', items, [...keys, 'items', 'amount']);
  }

  function handleFormSubmit(event) {
    if (hasCategories) handleSubmit(event);
    else event.preventDefault();
  }

  function renderAmount() {
    // Con ítems, el monto es su suma: se muestra, pero no se escribe.
    if (amountFromItems) {
      const total = itemsTotal(values.items);
      return (
        <FormField
          label={t('expenses.fields.amount')}
          className="mono"
          readOnly
          hint={t('expenses.form.amountFromItems')}
          value={Number.isNaN(total) ? '' : formatAmount(total)}
        />
      );
    }
    let hint = t('expenses.form.amountHint', { count: AMOUNT_MAX_DECIMALS });
    if (hasItems) hint = `${t('expenses.form.amountWithoutItems')} ${hint}`;
    return (
      <FormField
        label={t('expenses.fields.amount')}
        name="amount"
        className="mono"
        inputMode="decimal"
        autoComplete="off"
        hint={hint}
        value={values.amount}
        onChange={handleChange}
        errors={fieldErrors.amount}
        required
      />
    );
  }

  return (
    <form ref={formRef} className="form" onSubmit={handleFormSubmit} noValidate>
      <FormAlert
        ref={alertRef}
        messages={formErrors}
        onRetry={isNetworkError ? retry : undefined}
      />
      <FormField
        ref={firstFieldRef}
        label={t('expenses.fields.date')}
        name="date"
        type="date"
        max={todayISO()}
        value={values.date}
        onChange={handleChange}
        errors={fieldErrors.date}
        required
      />
      <FormField
        as="select"
        label={t('expenses.fields.category')}
        name="categoryId"
        hint={hasCategories ? undefined : t('expenses.form.noCategories')}
        value={values.categoryId}
        onChange={handleChange}
        errors={fieldErrors.categoryId}
        required
      >
        <option value="">
          {hasCategories
            ? t('expenses.form.categoryPlaceholder')
            : t('expenses.form.noCategoriesOption')}
        </option>
        {categories.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </FormField>
      {renderAmount()}
      {hasItems && (
        <ExpenseItemsFields
          items={values.items}
          errors={fieldErrors}
          onChange={changeItem}
          onRemove={(index) => setItemRemoved(index, true)}
          onRestore={(index) => setItemRemoved(index, false)}
        />
      )}
      <FormField
        label={t('expenses.fields.description')}
        name="description"
        autoComplete="off"
        value={values.description}
        onChange={handleChange}
        errors={fieldErrors.description}
      />
      <FormField
        label={t('expenses.fields.isFixed')}
        name="isFixed"
        type="checkbox"
        hint={t('expenses.form.isFixedHint')}
        checked={values.isFixed}
        onChange={handleChange}
        errors={fieldErrors.isFixed}
      />
      <FormField
        as="select"
        label={t('expenses.fields.purchaseChannel')}
        name="purchaseChannel"
        value={values.purchaseChannel}
        onChange={handleChange}
        errors={fieldErrors.purchaseChannel}
      >
        <option value="">{t('expenses.form.channelNone')}</option>
        {PURCHASE_CHANNELS.map((code) => (
          <option key={code} value={code}>
            {formatPurchaseChannel(code, t)}
          </option>
        ))}
      </FormField>
      <div className="form__actions">
        <Button type="submit" isLoading={isSubmitting} disabled={!hasCategories}>
          {isEditing ? t('expenses.form.update') : t('expenses.form.submit')}
        </Button>
        {isEditing && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
      {isSubmitting && <LoadingIndicator label={t('expenses.form.submitting')} />}
    </form>
  );
}
