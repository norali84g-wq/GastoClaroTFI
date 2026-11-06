import { useTranslation } from 'react-i18next';
import { AMOUNT_MAX_DECIMALS } from '../../config/constants';
import { useForm } from '../../hooks/useForm';
import { todayISO } from '../../utils/dates';
import { toIncomeFormValues, toNewIncome, validateIncome } from '../../validation/incomes';
import Button from '../ui/Button';
import FormAlert from '../ui/FormAlert';
import FormField from '../ui/FormField';
import LoadingIndicator from '../ui/LoadingIndicator';

// Alta o edición de un ingreso. Con `income`, el formulario arranca con sus datos y ofrece cancelar
// (onCancel); sin él, es un alta que se vacía después de guardar y lleva el foco a `firstFieldRef`
// para cargar otro. Para pasar de un ingreso a otro, quien llama lo vuelve a montar (con `key`).
// onSubmit(income) recibe el ingreso con amount como número. La confirmación la muestra quien
// llama; los errores generales de la API (field "base") se avisan en `toast` (lo que devuelve
// useToast), si se pasa.
export default function IncomeForm({ income, onSubmit, onCancel, firstFieldRef, toast }) {
  const { t } = useTranslation();
  const isEditing = Boolean(income);
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
    initialValues: isEditing ? toIncomeFormValues(income) : { date: todayISO(), amount: '' },
    validate: (formValues) => validateIncome(formValues, t),
    onSubmit: (formValues) => onSubmit(toNewIncome(formValues)),
    resetOnSuccess: !isEditing,
    successFocusRef: isEditing ? undefined : firstFieldRef,
    toast,
  });

  return (
    <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
      <FormAlert
        ref={alertRef}
        messages={formErrors}
        onRetry={isNetworkError ? retry : undefined}
      />
      <FormField
        ref={firstFieldRef}
        label={t('incomes.fields.date')}
        name="date"
        type="date"
        value={values.date}
        onChange={handleChange}
        errors={fieldErrors.date}
        required
      />
      <FormField
        label={t('incomes.fields.amount')}
        name="amount"
        className="mono"
        inputMode="decimal"
        autoComplete="off"
        hint={t('incomes.form.amountHint', { count: AMOUNT_MAX_DECIMALS })}
        value={values.amount}
        onChange={handleChange}
        errors={fieldErrors.amount}
        required
      />
      <Button type="submit" isLoading={isSubmitting}>
        {isEditing ? t('incomes.form.update') : t('incomes.form.submit')}
      </Button>
      {isEditing && (
        <Button variant="secondary" disabled={isSubmitting} onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      )}
      {isSubmitting && <LoadingIndicator label={t('incomes.form.submitting')} />}
    </form>
  );
}
