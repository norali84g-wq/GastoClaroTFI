import { Status } from '../components/chanchito.jsx';
import { Link, Navigate } from '@tanstack/react-router';
import { ApiError } from '../api/client.js';
import { Brand, Icon } from '../components/brand.jsx';
import { Field } from '../components/common.jsx';
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

const authFields = ['user', 'email', 'password', 'password_confirmation'];

export function AuthPage({ mode }) {
  const session = useSession();
  const { busy, error, run } = useAction();
  const registering = mode === 'register';
  const title = registering ? text.register : text.login;
  const buttonText = registering ? text.register : text.signIn;
  const busyText = registering ? text.saving : text.signingIn;
  const generalError = error?.issues?.length
    ? error.issues
        .filter(({ field }) => !authFields.includes(field))
        .map(({ message }) => message)
        .join(' · ')
    : error && displayError(error);
  if (session) return <Navigate to="/inicio" replace />;

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    run(async () => {
      if (registering && values.password !== values.password_confirmation) {
        throw new ApiError(422, [{ field: 'password_confirmation', message: text.mismatch }]);
      }
      if (registering && !values.user.trim()) delete values.user;
      await authenticate(mode, values);
    });
  }

  return (
    <main className="auth-screen">
      <div className="auth panel">
        <Brand />
        <h1>{title}</h1>
        <form onSubmit={submit}>
          <Field
            label={text.user}
            name="user"
            autoComplete="username"
            error={error}
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
            error={error}
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
          {generalError && <Status pose="error" message={generalError} />}
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
