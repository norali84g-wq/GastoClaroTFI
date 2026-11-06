import { screen } from '@testing-library/react';
import { getToken } from '../api/tokenStorage';
import { ROUTES } from '../config/constants';
import es from '../locales/es.json';
import {
  apiErrors,
  emptyDashboardRoutes,
  fetchCall,
  heldResponse,
  jsonResponse,
  mockApi,
  mockFetch,
  TEST_TOKEN,
  TEST_USER,
} from '../test/api';
import { renderApp } from '../test/renderApp';
import { logError } from '../utils/logger';

async function fillAndSubmit(user, { username = 'nico', password = 'clave1234' } = {}) {
  await user.type(screen.getByLabelText(es.auth.user), username);
  await user.type(screen.getByLabelText(es.auth.password), password);
  await user.click(screen.getByRole('button', { name: es.login.submit }));
}

describe('Login', () => {
  it('con credenciales correctas entra a la pantalla protegida', async () => {
    const fetchMock = mockApi({
      ...emptyDashboardRoutes(),
      'POST /login': jsonResponse(200, { token: TEST_TOKEN, user: TEST_USER }),
    });
    const { user } = renderApp(ROUTES.DASHBOARD);

    await fillAndSubmit(user);

    expect(await screen.findByRole('heading', { name: es.dashboard.title })).toBeInTheDocument();
    expect(getToken()).toBe(TEST_TOKEN);
    const call = fetchCall(fetchMock);
    expect(call.url).toMatch(/\/login$/);
    expect(call.method).toBe('POST');
    expect(call.body).toEqual({ user: 'nico', password: 'clave1234' });
  });

  it('con credenciales incorrectas avisa el mensaje de la API y sigue en el login', async () => {
    const message = 'Usuario o contraseña incorrectos';
    mockFetch(jsonResponse(401, apiErrors(['base', message])));
    const { user } = renderApp(ROUTES.LOGIN);

    await fillAndSubmit(user, { password: 'equivocada' });

    // Un error "base" es general: va en el aviso flotante, no en un campo.
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByLabelText(es.auth.user)).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText(es.auth.password)).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('heading', { name: es.login.title })).toBeInTheDocument();
    expect(screen.queryByText(es.auth.sessionExpired)).not.toBeInTheDocument();
    expect(getToken()).toBeNull();
    expect(logError).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));

    // El aviso de error no se cierra solo: queda hasta que se cierra a mano.
    await user.click(screen.getByRole('button', { name: es.common.close }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('al volver a enviar, cierra el aviso de error anterior', async () => {
    const message = 'Usuario o contraseña incorrectos';
    // El segundo intento queda pendiente, para ver el formulario mientras se envía.
    mockApi({
      'POST /login': [jsonResponse(401, apiErrors(['base', message])), () => new Promise(() => {})],
    });
    const { user } = renderApp(ROUTES.LOGIN);

    await fillAndSubmit(user, { password: 'equivocada' });
    expect(await screen.findByRole('alert')).toHaveTextContent(message);

    await user.click(screen.getByRole('button', { name: es.login.submit }));

    expect(screen.getByText(es.login.submitting)).toBeInTheDocument();
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('no envía el formulario vacío y lleva el foco al primer campo con problema', async () => {
    const fetchMock = mockFetch();
    const { user } = renderApp(ROUTES.LOGIN);

    await user.click(screen.getByRole('button', { name: es.login.submit }));

    const userField = screen.getByLabelText(es.auth.user);
    expect(userField).toHaveAccessibleDescription(es.validation.required);
    expect(userField).toHaveFocus();
    expect(screen.getByLabelText(es.auth.password)).toHaveAccessibleDescription(
      es.validation.required,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ante un error de red muestra el mensaje genérico y permite reintentar', async () => {
    mockApi({
      ...emptyDashboardRoutes(),
      'POST /login': [
        new TypeError('Failed to fetch'),
        jsonResponse(200, { token: TEST_TOKEN, user: TEST_USER }),
      ],
    });
    const { user } = renderApp(ROUTES.LOGIN);

    await fillAndSubmit(user);

    expect(await screen.findByText(es.errors.network)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: es.common.retry }));

    expect(await screen.findByRole('heading', { name: es.dashboard.title })).toBeInTheDocument();
  });

  it('deshabilita el envío y muestra la carga mientras espera la respuesta', async () => {
    const held = heldResponse();
    vi.stubGlobal('fetch', vi.fn(held.handler));
    const { user } = renderApp(ROUTES.LOGIN);

    await fillAndSubmit(user);

    expect(screen.getByRole('button', { name: es.login.submit })).toBeDisabled();
    expect(screen.getByText(es.login.submitting)).toBeInTheDocument();

    held.respond(jsonResponse(200, { token: TEST_TOKEN, user: TEST_USER }));
    expect(await screen.findByRole('heading', { name: es.dashboard.title })).toBeInTheDocument();
  });
});
