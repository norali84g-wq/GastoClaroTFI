import { useTranslation } from 'react-i18next';
import { listUsers } from '../api/users';
import { useRemoteData } from '../hooks/useRemoteData';
import { useSession } from '../hooks/useSession';
import { requestErrorMessages } from '../utils/errors';
import EmptyState from '../components/ui/EmptyState';
import FormAlert from '../components/ui/FormAlert';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';

// Usuarios registrados: solo los ve el administrador (la API lo exige; acá se avisa en lugar de
// pedirlos). Es un listado de consulta: la API no permite crear, editar ni borrar usuarios.
export default function UsersPage() {
  const { t } = useTranslation();
  const { user } = useSession();

  if (!user?.admin) {
    return (
      <section className="page">
        <PageHeader eyebrow={t('nav.users')} title={t('users.title')} />
        <p role="alert">{t('users.adminOnly')}</p>
      </section>
    );
  }

  return <UsersList />;
}

// El pedido vive en un componente aparte para que solo se haga cuando la persona es administradora.
function UsersList() {
  const { t } = useTranslation();
  const { data, isLoading, error, retry } = useRemoteData(listUsers);

  function renderList() {
    if (isLoading) return <LoadingIndicator label={t('users.loading')} />;
    if (error) {
      return (
        <FormAlert messages={requestErrorMessages(error, 'users.loadError', t)} onRetry={retry} />
      );
    }
    if (data.length === 0) {
      return <EmptyState headingLevel={3} title={t('users.emptyTitle')} />;
    }
    return (
      <div className="table-wrapper">
        <table className="data-table data-table--stack">
          <caption>{t('users.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('users.fields.user')}</th>
              <th scope="col">{t('users.fields.email')}</th>
              <th scope="col">{t('users.fields.role')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td data-label={t('users.fields.user')} className="free-text">
                  {item.user}
                </td>
                <td data-label={t('users.fields.email')} className="free-text">
                  {item.email ?? <span className="muted">{t('users.noEmail')}</span>}
                </td>
                <td data-label={t('users.fields.role')}>
                  {item.admin ? t('users.roles.admin') : t('users.roles.user')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="page">
      <PageHeader eyebrow={t('nav.users')} title={t('users.title')} />
      <section className="panel">
        <p className="muted">{t('users.note')}</p>
        {renderList()}
      </section>
    </section>
  );
}
