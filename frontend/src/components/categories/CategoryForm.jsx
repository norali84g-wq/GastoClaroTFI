import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '../../hooks/useForm';
import { toCategory, toCategoryFormValues, validateCategory } from '../../validation/categories';
import Button from '../ui/Button';
import FormAlert from '../ui/FormAlert';
import FormField from '../ui/FormField';
import LoadingIndicator from '../ui/LoadingIndicator';

// Nombres de campo de la API que no coinciden con los del formulario.
const API_FIELDS = { parent_id: 'parentId', tracks_installments: 'tracksInstallments' };

// Alta o edición de una categoría. Con `category`, el formulario arranca con sus datos y ofrece
// cancelar (onCancel); sin ella, es un alta que se vacía después de guardar y lleva el foco a
// `firstFieldRef`. `categories` son las que se pueden elegir como categoría principal (en la
// edición se descarta la propia). Para pasar de una categoría a otra, quien llama lo vuelve a
// montar (con `key`). La confirmación la muestra quien llama; los errores generales de la API se
// avisan en `toast`.
export default function CategoryForm({
  categories,
  category,
  onSubmit,
  onCancel,
  firstFieldRef,
  toast,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(category);
  const parents = categories.filter(({ id }) => id !== category?.id);
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
    initialValues: isEditing
      ? toCategoryFormValues(category)
      : { name: '', parentId: '', tracksInstallments: false },
    validate: (formValues) => validateCategory(formValues, t),
    onSubmit: (formValues) => onSubmit(toCategory(formValues)),
    apiFields: API_FIELDS,
    resetOnSuccess: !isEditing,
    successFocusRef: isEditing ? undefined : firstFieldRef,
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
        label={t('categories.fields.name')}
        name="name"
        autoComplete="off"
        value={values.name}
        onChange={handleChange}
        errors={fieldErrors.name}
        required
      />
      <FormField
        as="select"
        label={t('categories.fields.parent')}
        name="parentId"
        hint={t('categories.form.parentHint')}
        value={values.parentId}
        onChange={handleChange}
        errors={fieldErrors.parentId}
      >
        <option value="">{t('categories.form.noParent')}</option>
        {parents.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </FormField>
      <FormField
        label={t('categories.fields.tracksInstallments')}
        name="tracksInstallments"
        type="checkbox"
        hint={t('categories.form.tracksInstallmentsHint')}
        checked={values.tracksInstallments}
        onChange={handleChange}
        errors={fieldErrors.tracksInstallments}
      />
      <div className="form__actions">
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? t('categories.form.update') : t('categories.form.submit')}
        </Button>
        {isEditing && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
      {isSubmitting && <LoadingIndicator label={t('categories.form.submitting')} />}
    </form>
  );
}
