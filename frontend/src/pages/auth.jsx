import { Link, Navigate } from '@tanstack/react-router';
import { Field, FormError } from '../components/common.jsx';
import { useAction } from '../hooks/data.js';
import { authenticate, useSession } from '../hooks/session.js';
import { text } from '../texts.js';

export function Welcome() {
  return (
    <main className="welcome">
      <div>
        <p className="eyebrow">{text.brand}</p>
        <h1>{text.slogan}</h1>
        <p>{text.welcome}</p>
        <p>{text.intro}</p>
        <div className="actions">
          <Link className="button" to="/register">
            {text.register}
          </Link>
          <Link className="button secondary" to="/login">
            {text.login}
          </Link>
        </div>
      </div>
      <img src="/welcome.svg" alt="" width="440" height="330" />
    </main>
  );
}

export function AuthPage({ mode }) {
  const session = useSession();
  const { busy, error, run } = useAction();
  const registering = mode === 'register';
  const title = registering ? text.register : text.login;
  if (session) return <Navigate to="/inicio" replace />;

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    run(async () => {
      if (registering && values.password !== values.password_confirmation) {
        throw new Error(text.mismatch);
      }
      await authenticate(mode, values);
    });
  }

  return (
    <main className="auth panel">
      <Link to="/">{text.brand}</Link>
      <h1>{title}</h1>
      <form onSubmit={submit}>
        <Field label={text.user} name="user" autoComplete="username" error={error} required />
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
        <FormError error={error} />
        <button disabled={busy}>{busy ? text.saving : title}</button>
      </form>
      <p>
        <Link to={registering ? '/login' : '/register'}>
          {registering ? text.login : text.register}
        </Link>
      </p>
    </main>
  );
}
