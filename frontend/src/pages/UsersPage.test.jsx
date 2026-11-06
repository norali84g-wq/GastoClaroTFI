import { screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { ROUTES } from '../config/constants';
import es from '../locales/es.json';
import { fetchCallsTo, jsonResponse, mockApi, TEST_TOKEN, TEST_USER } from '../test/api';
import { renderApp } from '../test/renderApp';

const ADMIN = { ...TEST_USER, admin: true };

function renderUsers(routes = {}, user = ADMIN) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    'GET /me': jsonResponse(200, user),
    'GET /users': jsonResponse(200, []),
    ...routes,
  });
  return { fetchMock, ...renderApp(ROUTES.USERS) };
}

describe('Usuarios', () => {
  it('un usuario común no ve el menú ni pide el listado', async () => {
    const { fetchMock } = renderUsers({}, TEST_USER);

    expect(await screen.findByText(es.users.adminOnly)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: es.nav.users })).not.toBeInTheDocument();
    expect(fetchCallsTo(fetchMock, 'GET /users')).toHaveLength(0);
  });

  it('el administrador ve cada usuario con su correo y su rol', async () => {
    renderUsers({
      'GET /users': jsonResponse(200, [
        { id: 1, user: 'admin', email: null, admin: true },
        { id: 2, user: 'nico', email: 'nico@example.com', admin: false },
      ]),
    });

    const table = await screen.findByRole('table', { name: es.users.caption });
    const [, admin, nico] = within(table).getAllByRole('row');
    expect(admin).toHaveTextContent('admin');
    expect(admin).toHaveTextContent(es.users.noEmail);
    expect(admin).toHaveTextContent(es.users.roles.admin);
    expect(nico).toHaveTextContent('nico@example.com');
    expect(nico).toHaveTextContent(es.users.roles.user);
    expect(screen.getByRole('link', { name: es.nav.users })).toBeInTheDocument();
  });

  it('si falla la carga, muestra el error y permite reintentar', async () => {
    const { user } = renderUsers({
      'GET /users': [new TypeError('Failed to fetch'), jsonResponse(200, [])],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(es.errors.network);
    await user.click(screen.getByRole('button', { name: es.common.retry }));

    expect(await screen.findByText(es.users.emptyTitle)).toBeInTheDocument();
  });
});
