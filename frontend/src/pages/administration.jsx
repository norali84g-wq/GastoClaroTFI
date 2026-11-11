import { Navigate } from '@tanstack/react-router';
import { useContext, useState } from 'react';
import { AdministrationTabs } from '../components/administration-tabs.jsx';
import { Status } from '../components/chanchito.jsx';
import { DataState, Field, FormError } from '../components/common.jsx';
import { ConfirmAction } from '../components/confirm-action.jsx';
import { formatAccountDate, fullName } from '../domain/account.js';
import { useAction, useData } from '../hooks/data.js';
import { AccountContext, api } from '../hooks/session.js';
import { text } from '../texts.js';

const summaryFields = [
  ['total', text.adminTotal],
  ['active', text.adminActiveUsers],
  ['admins', text.adminAdmins],
  ['new_last_30_days', text.adminNewUsers],
];
const userColumns = [
  text.fullName,
  text.user,
  text.email,
  text.adminRole,
  text.adminCreated,
  text.adminExpenses,
  text.adminLastExpense,
  text.adminSupportCount,
  text.adminState,
  text.adminActions,
];

function SummaryCard({ title, value }) {
  return (
    <article className="panel">
      <h3>{title}</h3>
      <strong>{value}</strong>
    </article>
  );
}

function Summary() {
  const stats = useData(api.userStats);
  const support = useData(api.supportMessages);
  return (
    <section aria-labelledby="admin-summary">
      <h2 id="admin-summary">{text.adminSummary}</h2>
      <div className="administration-summary">
        <DataState result={stats}>
          {(data) =>
            summaryFields.map(([key, title]) => (
              <SummaryCard key={key} title={title} value={data[key]} />
            ))
          }
        </DataState>
        <DataState result={support}>
          {(messages) => (
            <SummaryCard
              title={text.adminPendingSupport}
              value={messages.filter(({ attended }) => attended === false).length}
            />
          )}
        </DataState>
      </div>
    </section>
  );
}

const normalized = (value) =>
  value.toLocaleLowerCase('es-AR').normalize('NFD').replace(/\p{M}/gu, '');

function Users({ currentUser }) {
  const users = useData(api.users);
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState(null);
  const filter = normalized(query.trim());

  return (
    <section aria-labelledby="admin-users">
      <h2 id="admin-users">{text.adminUsers}</h2>
      <div className="toolbar">
        <Field
          label={text.adminSearchUsers}
          name="search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <DataState result={users}>
        {(rows) => {
          const visible = rows.filter((user) =>
            normalized(`${fullName(user)} ${user.email ?? ''}`).includes(filter),
          );
          if (!visible.length) return <Status message={text.adminNoUsers} />;
          return (
            <div
              className="panel administration-table"
              tabIndex={0}
              role="region"
              aria-label={text.adminUsers}
            >
              <table className="gc-report-table">
                <thead>
                  <tr>
                    {userColumns.map((title) => (
                      <th scope="col" key={title}>
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((user) => (
                    <tr key={user.id}>
                      <th scope="row">{fullName(user) || text.adminMissingName}</th>
                      <td>{user.user}</td>
                      <td>{user.email}</td>
                      <td>{user.admin ? text.adminRoleName : text.adminUserRole}</td>
                      <td>{formatAccountDate(user.created_at) ?? text.notProvided}</td>
                      <td>{user.expenses_count}</td>
                      <td>{formatAccountDate(user.last_expense_on) ?? text.notProvided}</td>
                      <td>
                        {user.support_messages_count}
                        {user.pending_support_messages_count > 0 && (
                          <span className="administration-badge is-pending">
                            {text.adminPendingCount(user.pending_support_messages_count)}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`administration-badge${user.active === false ? ' is-inactive' : ''}`}
                        >
                          {user.active === false ? text.adminInactive : text.adminActive}
                        </span>
                      </td>
                      <td>
                        {user.id !== currentUser.id && (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => setTarget(user)}
                          >
                            {user.active === false ? text.activate : text.deactivate}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
      </DataState>
      {target && (
        <UserConfirmation
          key={target.id}
          target={target}
          onClose={() => setTarget(null)}
          onSaved={users.reload}
        />
      )}
    </section>
  );
}

function UserConfirmation({ target, onClose, onSaved }) {
  const { busy, error, run } = useAction();
  const activating = target.active === false;
  return (
    <ConfirmAction
      title={text.adminConfirmUser(activating, fullName(target) || target.user || target.email)}
      description={activating ? text.adminActivateDescription : text.adminDeactivateDescription}
      label={activating ? text.activate : text.deactivate}
      busy={busy}
      error={error}
      onCancel={onClose}
      onConfirm={() =>
        run(async () => {
          await api.updateUser(target.id, { active: activating });
          onSaved();
          onClose();
        })
      }
    />
  );
}

function SupportEntry({ item, onSaved }) {
  const { busy, error, run } = useAction();
  const sender = typeof item.user === 'object' ? item.user : null;
  return (
    <li className={`panel administration-message${item.attended ? '' : ' is-pending'}`}>
      <div className="administration-message-header">
        <h3>{item.subject}</h3>
        <span className={`administration-badge${item.attended ? '' : ' is-pending'}`}>
          {item.attended ? text.adminAttended : text.pending}
        </span>
      </div>
      <dl>
        <div>
          <dt>{text.user}</dt>
          <dd>{sender?.user ?? (typeof item.user === 'string' ? item.user : text.notProvided)}</dd>
        </div>
        <div>
          <dt>{text.email}</dt>
          <dd>{sender?.email ?? item.email ?? text.noEmail}</dd>
        </div>
        <div>
          <dt>{text.date}</dt>
          <dd>{formatAccountDate(item.created_at) ?? text.notProvided}</dd>
        </div>
      </dl>
      <p className="administration-message-body">{item.message}</p>
      <FormError error={error} />
      <button
        type="button"
        className="secondary"
        disabled={busy}
        onClick={() =>
          run(async () => {
            await api.updateSupportMessage(item.id, { attended: !item.attended });
            onSaved();
          })
        }
      >
        {busy ? text.saving : item.attended ? text.adminMarkPending : text.adminMarkAttended}
      </button>
    </li>
  );
}

function Support() {
  const messages = useData(api.supportMessages);
  return (
    <section aria-labelledby="admin-support">
      <h2 id="admin-support">{text.support}</h2>
      <DataState result={messages}>
        {(items) =>
          items.length ? (
            <ul className="records">
              {[...items]
                .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
                .map((item) => (
                  <SupportEntry key={item.id} item={item} onSaved={messages.reload} />
                ))}
            </ul>
          ) : (
            <Status message={text.adminNoSupport} />
          )
        }
      </DataState>
    </section>
  );
}

export function Administration({ tab = 'resumen' }) {
  const account = useContext(AccountContext);
  if (!account.admin) return <Navigate to="/inicio" replace />;
  return (
    <>
      <h1>{text.administration}</h1>
      <AdministrationTabs current={tab} />
      {tab === 'resumen' && <Summary />}
      {tab === 'usuarios' && <Users currentUser={account} />}
      {tab === 'soporte' && <Support />}
    </>
  );
}
