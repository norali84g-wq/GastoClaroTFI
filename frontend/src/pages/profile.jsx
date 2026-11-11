import { useContext, useState } from 'react';
import { version } from '../../package.json';
import { ApiError } from '../api/client.js';
import { Chanchito } from '../components/chanchito.jsx';
import { currentDate, Field, FormError } from '../components/common.jsx';
import { ConfirmAction } from '../components/confirm-action.jsx';
import { EditorActions } from '../components/planning.jsx';
import { formatAccountDate, fullName } from '../domain/account.js';
import { useAction } from '../hooks/data.js';
import { AccountContext, api, logout } from '../hooks/session.js';
import { text } from '../texts.js';

const profileFields = ['first_name', 'last_name', 'birth_date', 'dni'];

function ProfileForm({ user, onSaved, onCancel }) {
  const { busy, error, run } = useAction();

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const enteredDni = values.dni.trim();
    const dni = enteredDni.replaceAll('.', '');
    run(async () => {
      const issues = [];
      if (values.birth_date > currentDate()) {
        issues.push({ field: 'birth_date', message: text.futureBirthDate });
      }
      if (enteredDni && !/^\d{7,8}$/.test(dni)) {
        issues.push({ field: 'dni', message: text.invalidDni });
      }
      if (issues.length) throw new ApiError(422, issues);
      await api.updateMe({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        birth_date: values.birth_date,
        dni,
      });
      const updated = await api.me();
      onSaved(updated);
    });
  }

  return (
    <form onSubmit={submit} className="profile-form">
      <FormError error={error} fieldNames={profileFields} />
      <Field
        label={text.firstName}
        name="first_name"
        defaultValue={user.first_name}
        autoComplete="given-name"
        error={error}
      />
      <Field
        label={text.lastName}
        name="last_name"
        defaultValue={user.last_name}
        autoComplete="family-name"
        error={error}
      />
      <Field
        label={text.birthDate}
        name="birth_date"
        type="date"
        defaultValue={user.birth_date}
        max={currentDate()}
        autoComplete="bday"
        error={error}
      />
      <Field label={text.dni} name="dni" defaultValue={user.dni} error={error} />
      <EditorActions busy={busy} onCancel={onCancel} />
    </form>
  );
}

function SupportForm() {
  const { busy, error, run } = useAction();
  const [sent, setSent] = useState(false);

  function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSent(false);
    run(async () => {
      const subject = values.get('subject').trim();
      const message = values.get('message').trim();
      const issues = [];
      if (!subject) issues.push({ field: 'subject', message: text.requiredValue });
      if (!message) issues.push({ field: 'message', message: text.requiredValue });
      if (issues.length) throw new ApiError(422, issues);
      await api.createSupportMessage({ subject, message });
      form.reset();
      setSent(true);
    });
  }

  return (
    <section className="panel profile-section" aria-labelledby="profile-support">
      <h2 id="profile-support">{text.support}</h2>
      <form onSubmit={submit} className="profile-form">
        <FormError error={error} fieldNames={['subject', 'message']} />
        {sent && <p role="status">{text.supportSent}</p>}
        <Field label={text.supportSubject} name="subject" maxLength={120} error={error} required />
        <Field
          label={text.supportMessage}
          name="message"
          multiline
          rows={5}
          maxLength={2000}
          error={error}
          required
        />
        <div className="actions">
          <button disabled={busy}>{busy ? text.saving : text.sendSupport}</button>
        </div>
      </form>
    </section>
  );
}

export function Profile() {
  const user = useContext(AccountContext);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const name = fullName(user) || user.user || user.email || text.notProvided;
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length > 1
      ? parts
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
      : Array.from(name).slice(0, 2).join('');

  async function signOut() {
    setSigningOut(true);
    try {
      await logout();
    } catch (error) {
      if (error.status !== 401) window.alert(text.logoutFailed);
    }
  }

  return (
    <>
      <section className="panel profile-card" aria-labelledby="profile-title">
        <header className="profile-hero">
          <div className="profile-identity">
            <h1 id="profile-title">{text.profile}</h1>
            <div className="profile-name">
              <span className="profile-avatar" aria-hidden="true">
                {initials}
              </span>
              <p>{name}</p>
            </div>
          </div>
          <div className="profile-mascot">
            <Chanchito pose="feliz" size={152} />
          </div>
        </header>
        <div className="profile-details">
          <dl>
            <div>
              <dt>{text.user}</dt>
              <dd>{user.user}</dd>
            </div>
            <div>
              <dt>{text.email}</dt>
              <dd>{user.email ?? text.noEmail}</dd>
            </div>
            <div>
              <dt>{text.birthDate}</dt>
              <dd>{formatAccountDate(user.birth_date) ?? text.notProvided}</dd>
            </div>
            <div>
              <dt>{text.dni}</dt>
              <dd>{user.dni || text.notProvided}</dd>
            </div>
          </dl>
          {saved && <p role="status">{text.profileSaved}</p>}
          {editing ? (
            <ProfileForm
              user={user}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                user.setProfile(updated);
                setEditing(false);
                setSaved(true);
              }}
            />
          ) : (
            <footer className="actions profile-actions">
              <button
                type="button"
                onClick={() => {
                  setSaved(false);
                  setEditing(true);
                }}
              >
                {text.edit}
              </button>
              <button className="secondary" type="button" onClick={() => setConfirmLogout(true)}>
                {text.logout}
              </button>
            </footer>
          )}
        </div>
      </section>
      <section className="panel profile-section" aria-labelledby="profile-about">
        <h2 id="profile-about">{text.appInformation}</h2>
        <p>
          <strong>{text.brand}</strong> · {text.appVersion(version)}
        </p>
        <p>{text.appDescription}</p>
      </section>
      <SupportForm />
      {confirmLogout && (
        <ConfirmAction
          title={text.logoutConfirm}
          description={text.logoutDescription}
          label={text.logout}
          busy={signingOut}
          onCancel={() => setConfirmLogout(false)}
          onConfirm={signOut}
        />
      )}
    </>
  );
}
