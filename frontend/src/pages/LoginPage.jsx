import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/constants';
import { useForm } from '../hooks/useForm';
import { useSession } from '../hooks/useSession';
import { useToast } from '../hooks/useToast';
import { validateLogin } from '../validation/auth';
import AuthLayout from '../components/ui/AuthLayout';
import Button from '../components/ui/Button';
import FormAlert from '../components/ui/FormAlert';
import FormField from '../components/ui/FormField';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/ui/Toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, sessionExpired } = useSession();
  const expiredRef = useRef(null);
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
    initialValues: { user: '', password: '' },
    validate: (formValues) => validateLogin(formValues, t),
    onSubmit: login,
    toast: notice,
  });

  // Si se llegó acá porque la sesión venció, el aviso recibe el foco para que se anuncie.
  useEffect(() => {
    if (sessionExpired) expiredRef.current?.focus();
  }, [sessionExpired]);

  // La redirección después de un login exitoso la hace GuestRoute.
  return (
    <AuthLayout>
      <section className="page page--narrow">
        <PageHeader eyebrow={t('app.name')} title={t('login.title')} />
        <FormAlert
          ref={expiredRef}
          tone="warning"
          messages={sessionExpired ? t('auth.sessionExpired') : null}
        />
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
            label={t('auth.password')}
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            errors={fieldErrors.password}
            required
          />
          <Button type="submit" isLoading={isSubmitting}>
            {t('login.submit')}
          </Button>
          {isSubmitting && <LoadingIndicator label={t('login.submitting')} />}
        </form>
        <p>
          {t('login.noAccount')} <Link to={ROUTES.REGISTER}>{t('login.goToRegister')}</Link>
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
