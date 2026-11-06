import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ROUTES } from './config/constants';
import SessionProvider from './hooks/SessionProvider';
import App from './App';
import es from './locales/es.json';
import { saveToken } from './api/tokenStorage';
import { emptyDashboardRoutes, jsonResponse, mockApi, TEST_TOKEN } from './test/api';
import { renderApp } from './test/renderApp';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('renderiza la pantalla de login', () => {
    renderAt(ROUTES.LOGIN);
    expect(screen.getByRole('heading', { name: es.login.title })).toBeInTheDocument();
  });

  it('redirige al login al entrar a una ruta protegida sin sesión', () => {
    renderAt(ROUTES.DASHBOARD);
    expect(screen.getByRole('heading', { name: es.login.title })).toBeInTheDocument();
  });
});

// Recorre la pantalla con Tab desde el principio y devuelve los elementos que recibieron el foco.
async function tabThrough(user) {
  const visited = [];
  for (;;) {
    await user.tab();
    if (document.activeElement === document.body || visited.includes(document.activeElement)) {
      return visited;
    }
    visited.push(document.activeElement);
  }
}

describe('Teclado', () => {
  it('el primer Tab llega al enlace para saltar al contenido', async () => {
    const { user } = renderApp(ROUTES.LOGIN);

    await user.tab();

    const skipLink = screen.getByRole('link', { name: es.nav.skipToContent });
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveAttribute('href', `#${screen.getByRole('main').id}`);
  });

  it('en el login, Tab recorre navegación, campos, botón y enlace a registro, en ese orden', async () => {
    const { user } = renderApp(ROUTES.LOGIN);

    expect(await tabThrough(user)).toEqual([
      screen.getByRole('link', { name: es.nav.skipToContent }),
      screen.getByRole('link', { name: es.nav.login }),
      screen.getByRole('link', { name: es.nav.register }),
      screen.getByLabelText(es.auth.user),
      screen.getByLabelText(es.auth.password),
      screen.getByRole('button', { name: es.login.submit }),
      screen.getByRole('link', { name: es.login.goToRegister }),
    ]);
  });

  it('en el panel, todos los controles se alcanzan con Tab y cada campo tiene su etiqueta', async () => {
    saveToken(TEST_TOKEN);
    mockApi({
      ...emptyDashboardRoutes(),
      'GET /categories': jsonResponse(200, [{ id: 1, name: 'Supermercado' }]),
    });
    const { user } = renderApp(ROUTES.DASHBOARD);
    await screen.findByLabelText(es.expenses.fields.category);

    const visited = await tabThrough(user);

    const controls = [
      ...screen.getAllByRole('link'),
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('textbox'),
      ...screen.getAllByRole('combobox'),
      ...screen.getAllByRole('checkbox'),
      screen.getByLabelText(es.expenses.filter.label),
      screen.getByLabelText(es.expenses.fields.date),
    ];
    for (const control of controls) expect(visited).toContain(control);
    for (const field of document.querySelectorAll('input, select, textarea')) {
      expect(field.labels).toHaveLength(1);
      expect(field).toHaveAccessibleName(field.labels[0].textContent);
    }
  });
});
