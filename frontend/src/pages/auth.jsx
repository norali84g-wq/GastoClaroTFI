import { Status } from '../components/chanchito.jsx';
import { Link, Navigate } from '@tanstack/react-router';
import { ApiError } from '../api/client.js';
import { Brand, Icon } from '../components/brand.jsx';
import { currentDate, Field } from '../components/common.jsx';
import { displayError, useAction } from '../hooks/data.js';
import { authenticate, useSession } from '../hooks/session.js';
import { text } from '../texts.js';

export function Welcome() {
  return (
    <main className="welcome gc-welcome">
      <header className="gc-welcome-header">
        <Brand />
      </header>
      <section className="gc-hero" aria-labelledby="welcome-title">
        <div className="gc-hero-copy">
          <h1 id="welcome-title">{text.welcomeTitle}</h1>
          <p>{text.welcomePlan}</p>
          <p>{text.welcomePlanFollowup}</p>
        </div>
        <img
          src="/gastoclaro-hero.webp"
          alt=""
          width="920"
          height="613"
          loading="lazy"
          decoding="async"
        />
      </section>
      <ul className="gc-benefits">
        {text.welcomeBenefits.map(([icon, label]) => (
          <li key={icon}>
            <Icon name={icon} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <div className="actions gc-entry-actions">
        <Link className="button" to="/register">
          {text.welcomeStart}
        </Link>
        <Link className="button secondary" to="/login">
          {text.welcomeLogin}
        </Link>
      </div>
      <section className="gc-purpose" aria-labelledby="purpose-title">
        <p className="gc-motto">{text.welcomeMotto}</p>
        <h2 id="purpose-title">{text.welcomePurpose}</h2>
        <p>{text.welcomeContext}</p>
        <strong>{text.moneyEquation}</strong>
        <dl className="gc-pillars">
          {text.welcomePillars.map(([title, detail]) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

const loginFields = ['user', 'password'];
const registerFields = [
  ...loginFields,
  'email',
  'password_confirmation',
  'first_name',
  'last_name',
  'birth_date',
];

export function AuthPage({ mode }) {
  const session = useSession();
  const { busy, error, run } = useAction();
  const registering = mode === 'register';
  const title = registering ? text.register : text.login;
  const buttonText = registering ? text.register : text.signIn;
  const busyText = registering ? text.saving : text.signingIn;
  const fields = registering ? registerFields : loginFields;
  const disabledAccount = !registering && error?.status === 403;
  let generalError = error && displayError(error);
  if (disabledAccount) generalError = error.issues?.[0]?.message || generalError;
  else if (error?.issues?.length) {
    generalError = error.issues
      .filter(({ field }) => !fields.includes(field))
      .map(({ message }) => message)
      .join(' · ');
  }
  if (session) return <Navigate to="/inicio" replace />;

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    run(async () => {
      if (registering && values.password !== values.password_confirmation) {
        throw new ApiError(422, [{ field: 'password_confirmation', message: text.mismatch }]);
      }
      if (registering) {
        if (!values.user.trim()) delete values.user;
        values.first_name = values.first_name.trim();
        values.last_name = values.last_name.trim();
        const issues = [];
        if (!values.first_name) issues.push({ field: 'first_name', message: text.requiredValue });
        if (!values.last_name) issues.push({ field: 'last_name', message: text.requiredValue });
        if (values.birth_date > currentDate()) {
          issues.push({ field: 'birth_date', message: text.futureBirthDate });
        }
        if (issues.length) throw new ApiError(422, issues);
      }
      await authenticate(mode, values);
    });
  }

  return (
    <main className="auth-screen">
      <div className="auth panel">
        <Brand />
        <h1>{title}</h1>
        <form onSubmit={submit}>
          {generalError && <Status pose="error" message={generalError} />}
          {registering && (
            <>
              <Field
                label={text.firstName}
                name="first_name"
                autoComplete="given-name"
                error={error}
                required
              />
              <Field
                label={text.lastName}
                name="last_name"
                autoComplete="family-name"
                error={error}
                required
              />
              <Field
                label={text.birthDate}
                name="birth_date"
                type="date"
                autoComplete="bday"
                max={currentDate()}
                error={error}
                required
              />
            </>
          )}
          <Field
            label={text.user}
            name="user"
            autoComplete="username"
            error={disabledAccount ? null : error}
            required={!registering}
          />
          {registering && (
            <Field
              label={text.email}
              type="email"
              name="email"
              autoComplete="email"
              error={error}
              required
            />
          )}
          <Field
            label={text.password}
            type="password"
            name="password"
            autoComplete={registering ? 'new-password' : 'current-password'}
            minLength={registering ? 8 : undefined}
            error={disabledAccount ? null : error}
            required
          />
          {registering && (
            <Field
              label={text.confirmation}
              type="password"
              name="password_confirmation"
              autoComplete="new-password"
              error={error}
              required
            />
          )}
          {busy && <Status pose="cargando" message={busyText} />}
          <button disabled={busy}>{busy ? busyText : buttonText}</button>
        </form>
        <p>
          {!registering && <>{text.needAccount} </>}
          <Link to={registering ? '/login' : '/register'}>
            {registering ? text.login : text.register}
          </Link>
        </p>
      </div>
      <img
        className="auth-art"
        src="/gastoclaro-hero.webp"
        alt=""
        width="920"
        height="613"
        loading="lazy"
        decoding="async"
      />
    </main>
  );
}
