import { screen } from '@testing-library/react';
import { getToken, saveToken } from '../api/tokenStorage';
import { ROUTES } from '../config/constants';
import es from '../locales/es.json';
import {
  apiErrors,
  emptyDashboardRoutes,
  fetchCall,
  jsonResponse,
  mockApi,
  mockFetch,
  TEST_TOKEN,
} from '../test/api';
import { renderApp } from '../test/renderApp';

describe('Validación de la sesión al arrancar', () => {
  it('muestra la carga mientras valida y después la pantalla protegida', async () => {
    saveToken(TEST_TOKEN);
    const fetchMock = mockApi(emptyDashboardRoutes());
    renderApp(ROUTES.DASHBOARD);

    expect(screen.getByRole('status')).toHaveTextContent(es.common.loading);
    expect(screen.queryByRole('heading', { name: es.login.title })).not.toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: es.dashboard.title })).toBeInTheDocument();
    const call = fetchCall(fetchMock);
    expect(call.url).toMatch(/\/me$/);
    expect(call.headers.Authorization).toBe(`Bearer ${TEST_TOKEN}`);
  });

  it('si el token no sirve, lo limpia y va al login', async () => {
    saveToken(TEST_TOKEN);
    mockFetch(jsonResponse(401, apiErrors(['base', 'No autorizado'])));
    renderApp(ROUTES.DASHBOARD);

    expect(await screen.findByRole('heading', { name: es.login.title })).toBeInTheDocument();
    expect(screen.getByText(es.auth.sessionExpired)).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });
});
