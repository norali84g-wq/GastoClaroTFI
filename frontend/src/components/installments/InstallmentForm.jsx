import { useTranslation } from 'react-i18next';
import { AMOUNT_MAX_DECIMALS, INSTALLMENTS_MAX, INSTALLMENTS_MIN } from '../../config/constants';
import { useForm } from '../../hooks/useForm';
import { currentPeriod } from '../../utils/dates';
import {
  toInstallmentFormValues,
  toInstallmentPurchase,
  validateInstallmentPurchase,
} from '../../validation/installments';
import Button from '../ui/Button';
import FormAlert from '../ui/FormAlert';
import FormField from '../ui/FormField';
import LoadingIndicator from '../ui/LoadingIndicator';

// Nombres de campo de la API que no coinciden con los del formulario.
const API_FIELDS = {
  category_id: 'categoryId',
  total_amount: 'totalAmount',
  installments_count: 'installmentsCount',
  first_period: 'firstPeriod',
};

function emptyValues() {
  return {
    description: '',
    categoryId: '',
    totalAmount: '',
    installmentsCount: '',
    firstPeriod: currentPeriod(),
  };
}

// Alta o edición de una compra en cuotas. Con `purchase`, el formulario arranca con sus datos y
// ofrece cancelar (onCancel); sin ella, es un alta que se vacía después de guardar y lleva el foco a
// `firstFieldRef` para cargar otra. Para pasar de una compra a otra, quien llama lo vuelve a montar
// (con `key`). onSubmit(purchase) recibe los montos y los ids como números. La confirmación la
// muestra quien llama; los errores generales de la API se avisan en `toast`, si se pasa.
// Sin categorías no se puede guardar: el campo lo explica y el botón queda deshabilitado.
export default function InstallmentForm({
  categories,
  purchase,
  onSubmit,
  onCancel,
  firstFieldRef,
  toast,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(purchase);
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
    initialValues: isEditing ? toInstallmentFormValues(purchase) : emptyValues(),
    validate: (formValues) => validateInstallmentPurchase(formValues, t),
    onSubmit: (formValues) => onSubmit(toInstallmentPurchase(formValues)),
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
        label={t('installments.fields.description')}
        name="description"
        autoComplete="off"
        value={values.description}
        onChange={handleChange}
        errors={fieldErrors.description}
        required
      />
      <FormField
        as="select"
        label={t('installments.fields.category')}
        name="categoryId"
        hint={hasCategories ? undefined : t('installments.form.noCategories')}
        value={values.categoryId}
        onChange={handleChange}
        errors={fieldErrors.categoryId}
        required
      >
        <option value="">
          {hasCategories
            ? t('installments.form.categoryPlaceholder')
            : t('installments.form.noCategoriesOption')}
        </option>
        {categories.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </FormField>
      <FormField
        label={t('installments.fields.totalAmount')}
        name="totalAmount"
        className="mono"
        inputMode="decimal"
        autoComplete="off"
        hint={t('installments.form.amountHint', { count: AMOUNT_MAX_DECIMALS })}
        value={values.totalAmount}
        onChange={handleChange}
        errors={fieldErrors.totalAmount}
        required
      />
      <FormField
        label={t('installments.fields.installmentsCount')}
        name="installmentsCount"
        className="mono"
        inputMode="numeric"
        autoComplete="off"
        hint={t('installments.form.installmentsCountHint', {
          min: INSTALLMENTS_MIN,
          max: INSTALLMENTS_MAX,
        })}
        value={values.installmentsCount}
        onChange={handleChange}
        errors={fieldErrors.installmentsCount}
        required
      />
      <FormField
        label={t('installments.fields.firstPeriod')}
        name="firstPeriod"
        type="month"
        placeholder={t('installments.form.firstPeriodPlaceholder')}
        value={values.firstPeriod}
        onChange={handleChange}
        errors={fieldErrors.firstPeriod}
        required
      />
      <div className="form__actions">
        <Button type="submit" isLoading={isSubmitting} disabled={!hasCategories}>
          {isEditing ? t('installments.form.update') : t('installments.form.submit')}
        </Button>
        {isEditing && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
      {isSubmitting && <LoadingIndicator label={t('installments.form.submitting')} />}
    </form>
  );
}
