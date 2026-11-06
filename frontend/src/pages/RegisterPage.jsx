import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PASSWORD_MIN_LENGTH, ROUTES } from '../config/constants';
import { useForm } from '../hooks/useForm';
import { useSession } from '../hooks/useSession';
import { useToast } from '../hooks/useToast';
import { validateRegister } from '../validation/auth';
import AuthLayout from '../components/ui/AuthLayout';
import Button from '../components/ui/Button';
import FormAlert from '../components/ui/FormAlert';
import FormField from '../components/ui/FormField';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/ui/Toast';

// Nombres de campo de la API que no coinciden con los del formulario.
const API_FIELDS = { password_confirmation: 'passwordConfirmation' };

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useSession();
  const notice = useToast();
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
    initialValues: { user: '', email: '', password: '', passwordConfirmation: '' },
    validate: (formValues) => validateRegister(formValues, t),
    onSubmit: register,
    apiFields: API_FIELDS,
    toast: notice,
  });

  // La API devuelve el token al registrar: el usuario queda logueado y GuestRoute lo lleva adentro.
  return (
    <AuthLayout>
      <section className="page page--narrow">
        <PageHeader eyebrow={t('app.name')} title={t('register.title')} />
        <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
          <FormAlert
            ref={alertRef}
            messages={formErrors}
            onRetry={isNetworkError ? retry : undefined}
          />
          <FormField
            label={t('auth.user')}
            name="user"
            autoComplete="username"
            value={values.user}
            onChange={handleChange}
            errors={fieldErrors.user}
            required
          />
          <FormField
            label={t('auth.email')}
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            errors={fieldErrors.email}
            required
          />
          <FormField
            label={t('auth.password')}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            hint={t('auth.passwordHint', { count: PASSWORD_MIN_LENGTH })}
            value={values.password}
            onChange={handleChange}
            errors={fieldErrors.password}
            required
          />
          <FormField
            label={t('auth.passwordConfirmation')}
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            value={values.passwordConfirmation}
            onChange={handleChange}
            errors={fieldErrors.passwordConfirmation}
            required
          />
          <Button type="submit" isLoading={isSubmitting}>
            {t('register.submit')}
          </Button>
          {isSubmitting && <LoadingIndicator label={t('register.submitting')} />}
        </form>
        <p>
          {t('register.hasAccount')} <Link to={ROUTES.LOGIN}>{t('register.goToLogin')}</Link>
        </p>
        <Toast
          toast={notice.toast}
          onClose={notice.close}
          onPause={notice.pause}
          onResume={notice.resume}
        />
      </section>
    </AuthLayout>
  );
}
