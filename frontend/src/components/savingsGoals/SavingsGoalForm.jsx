import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AMOUNT_MAX_DECIMALS } from '../../config/constants';
import { useForm } from '../../hooks/useForm';
import { toSavingsGoal, validateSavingsGoal } from '../../validation/savingsGoals';
import Button from '../ui/Button';
import FormAlert from '../ui/FormAlert';
import FormField from '../ui/FormField';
import LoadingIndicator from '../ui/LoadingIndicator';

// Nombres de campo de la API que no coinciden con los del formulario.
const API_FIELDS = {
  target_amount: 'targetAmount',
  saved_amount: 'savedAmount',
};

// Alta o edición de una meta. Sin `goal` es un alta; con `goal` se carga con sus datos y lleva el
// foco al primer campo. onSubmit(goal) recibe la meta con los montos como números y deadline en
// null si no se puso. onCancel solo se usa al editar. `firstFieldRef` permite llevar el foco al
// formulario desde afuera; después de un alta, el foco vuelve ahí. La confirmación la muestra quien
// llama; los errores generales de la API se avisan en `toast` (lo que devuelve useToast).
// Para pasar de una meta a otra hay que montarlo de nuevo (por ejemplo, con `key`).
export default function SavingsGoalForm({ goal, onSubmit, onCancel, firstFieldRef, toast }) {
  const { t } = useTranslation();
  const isEditing = Boolean(goal);
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
    initialValues: {
      name: goal?.name ?? '',
      targetAmount: goal ? String(goal.targetAmount) : '',
      savedAmount: goal ? String(goal.savedAmount) : '',
      deadline: goal?.deadline ?? '',
    },
    validate: (formValues) => validateSavingsGoal(formValues, t),
    onSubmit: (formValues) => onSubmit(toSavingsGoal(formValues)),
    apiFields: API_FIELDS,
    resetOnSuccess: !isEditing,
    successFocusRef: firstFieldRef,
    toast,
  });

  useEffect(() => {
    if (isEditing) firstFieldRef?.current?.focus();
  }, [isEditing, firstFieldRef]);

  return (
    <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
      <FormAlert
        ref={alertRef}
        messages={formErrors}
        onRetry={isNetworkError ? retry : undefined}
      />
      <FormField
        ref={firstFieldRef}
        label={t('savingsGoals.fields.name')}
        name="name"
        autoComplete="off"
        value={values.name}
        onChange={handleChange}
        errors={fieldErrors.name}
        required
      />
      <FormField
        label={t('savingsGoals.fields.targetAmount')}
        name="targetAmount"
        className="mono"
        inputMode="decimal"
        autoComplete="off"
        hint={t('savingsGoals.form.amountHint', { count: AMOUNT_MAX_DECIMALS })}
        value={values.targetAmount}
        onChange={handleChange}
        errors={fieldErrors.targetAmount}
        required
      />
      <FormField
        label={t('savingsGoals.fields.savedAmount')}
        name="savedAmount"
        className="mono"
        inputMode="decimal"
        autoComplete="off"
        hint={t('savingsGoals.form.savedHint')}
        value={values.savedAmount}
        onChange={handleChange}
        errors={fieldErrors.savedAmount}
      />
      <FormField
        label={t('savingsGoals.fields.deadline')}
        name="deadline"
        type="date"
        hint={t('savingsGoals.form.deadlineHint')}
        value={values.deadline}
        onChange={handleChange}
        errors={fieldErrors.deadline}
      />
      <Button type="submit" isLoading={isSubmitting}>
        {isEditing ? t('savingsGoals.form.save') : t('savingsGoals.form.create')}
      </Button>
      {isEditing && (
        <Button variant="secondary" disabled={isSubmitting} onClick={onCancel}>
          {t('savingsGoals.form.cancel')}
        </Button>
      )}
      {isSubmitting && <LoadingIndicator label={t('savingsGoals.form.submitting')} />}
    </form>
  );
}
