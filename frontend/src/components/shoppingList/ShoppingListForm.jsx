import { useTranslation } from 'react-i18next';
import { AMOUNT_MAX_DECIMALS } from '../../config/constants';
import { useForm } from '../../hooks/useForm';
import { currentPeriod } from '../../utils/dates';
import {
  toShoppingListFormValues,
  toShoppingListItem,
  validateShoppingListItem,
} from '../../validation/shoppingListItems';
import Button from '../ui/Button';
import FormAlert from '../ui/FormAlert';
import FormField from '../ui/FormField';
import LoadingIndicator from '../ui/LoadingIndicator';

// Nombres de campo de la API que no coinciden con los del formulario.
const API_FIELDS = {
  category_id: 'categoryId',
  estimated_unit_price: 'estimatedUnitPrice',
};

function emptyValues() {
  return {
    name: '',
    categoryId: '',
    period: currentPeriod(),
    quantity: '',
    estimatedUnitPrice: '',
  };
}

// Alta o edición de un ítem de la lista de gastos fijos. Con `item`, el formulario arranca con sus
// datos y ofrece cancelar (onCancel); sin él, es un alta que se vacía después de guardar y lleva el
// foco a `firstFieldRef` para cargar otro. Para pasar de un ítem a otro, quien llama lo vuelve a
// montar (con `key`). onSubmit(item) recibe los montos y los ids como números (quantity en null si
// no se cargó). La confirmación la muestra quien llama; los errores generales de la API se avisan en
// `toast`. Sin categorías no se puede guardar: el campo lo explica y el botón queda deshabilitado.
export default function ShoppingListForm({
  categories,
  item,
  onSubmit,
  onCancel,
  firstFieldRef,
  toast,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(item);
  const hasCategories = categories.length > 0;
  const {
    values,
    fieldErrors,
    formErrors,
    isNetworkError,
    isSubmitting,
    handleChange,
    handleSubmit,
    retry,
    formRef,
    alertRef,
  } = useForm({
    initialValues: isEditing ? toShoppingListFormValues(item) : emptyValues(),
    validate: (formValues) => validateShoppingListItem(formValues, t),
    onSubmit: (formValues) => onSubmit(toShoppingListItem(formValues)),
    apiFields: API_FIELDS,
    resetOnSuccess: !isEditing,
    successFocusRef: isEditing ? undefined : firstFieldRef,
    toast,
  });

  function handleFormSubmit(event) {
    if (hasCategories) handleSubmit(event);
    else event.preventDefault();
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
        label={t('shoppingList.fields.name')}
        name="name"
        autoComplete="off"
        value={values.name}
        onChange={handleChange}
        errors={fieldErrors.name}
        required
      />
      <FormField
        as="select"
        label={t('shoppingList.fields.category')}
        name="categoryId"
        hint={hasCategories ? undefined : t('shoppingList.form.noCategories')}
        value={values.categoryId}
        onChange={handleChange}
        errors={fieldErrors.categoryId}
        required
      >
        <option value="">
          {hasCategories
            ? t('shoppingList.form.categoryPlaceholder')
            : t('shoppingList.form.noCategoriesOption')}
        </option>
        {categories.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </FormField>
      <FormField
        label={t('shoppingList.fields.period')}
        name="period"
        type="month"
        placeholder={t('shoppingList.form.periodPlaceholder')}
        value={values.period}
        onChange={handleChange}
        errors={fieldErrors.period}
        required
      />
      <FormField
        label={t('shoppingList.fields.quantity')}
        name="quantity"
        className="mono"
        inputMode="decimal"
        autoComplete="off"
        hint={t('shoppingList.form.quantityHint')}
        value={values.quantity}
        onChange={handleChange}
        errors={fieldErrors.quantity}
      />
      <FormField
        label={t('shoppingList.fields.estimatedUnitPrice')}
        name="estimatedUnitPrice"
        className="mono"
        inputMode="decimal"
        autoComplete="off"
        hint={t('shoppingList.form.amountHint', { count: AMOUNT_MAX_DECIMALS })}
        value={values.estimatedUnitPrice}
        onChange={handleChange}
        errors={fieldErrors.estimatedUnitPrice}
        required
      />
      <div className="form__actions">
        <Button type="submit" isLoading={isSubmitting} disabled={!hasCategories}>
          {isEditing ? t('shoppingList.form.update') : t('shoppingList.form.submit')}
        </Button>
        {isEditing && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
      {isSubmitting && <LoadingIndicator label={t('shoppingList.form.submitting')} />}
    </form>
  );
}
