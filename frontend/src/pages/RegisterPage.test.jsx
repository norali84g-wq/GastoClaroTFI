import { screen } from '@testing-library/react';
import { getToken } from '../api/tokenStorage';
import { PASSWORD_MIN_LENGTH, ROUTES } from '../config/constants';
import es from '../locales/es.json';
import {
  apiErrors,
  emptyDashboardRoutes,
  fetchCall,
  jsonResponse,
  mockApi,
  mockFetch,
  TEST_TOKEN,
  TEST_USER,
} from '../test/api';
import { renderApp } from '../test/renderApp';
import { logError } from '../utils/logger';

const VALID = {
  user: 'nico',
  email: 'nico@example.com',
  password: 'clave1234',
  passwordConfirmation: 'clave1234',
};

async function fillAndSubmit(user, values = VALID) {
  await user.type(screen.getByLabelText(es.auth.user), values.user);
  await user.type(screen.getByLabelText(es.auth.email), values.email);
  await user.type(screen.getByLabelText(es.auth.password), values.password);
  await user.type(screen.getByLabelText(es.auth.passwordConfirmation), values.passwordConfirmation);
  await user.click(screen.getByRole('button', { name: es.register.submit }));
}

describe('Registro', () => {
  it('con datos válidos deja al usuario logueado y lo lleva adentro', async () => {
    const fetchMock = mockApi({
      ...emptyDashboardRoutes(),
      'POST /register': jsonResponse(201, { token: TEST_TOKEN, user: TEST_USER }),
    });
    const { user } = renderApp(ROUTES.REGISTER);

    await fillAndSubmit(user);

    expect(await screen.findByRole('heading', { name: es.dashboard.title })).toBeInTheDocument();
    expect(getToken()).toBe(TEST_TOKEN);
    const call = fetchCall(fetchMock);
    expect(call.url).toMatch(/\/register$/);
    expect(call.body).toEqual({
      user: 'nico',
      email: 'nico@example.com',
      password: 'clave1234',
      password_confirmation: 'clave1234',
    });
  });

  it('muestra cada error de validación de la API junto a su campo', async () => {
    mockFetch(
      jsonResponse(
        422,
        apiErrors(['user', 'ya está en uso'], ['password_confirmation', 'no coincide']),
      ),
    );
    const { user } = renderApp(ROUTES.REGISTER);

    await fillAndSubmit(user);

    const userField = screen.getByLabelText(es.auth.user);
    expect(await screen.findByText('ya está en uso')).toBeInTheDocument();
    expect(userField).toHaveAccessibleDescription('ya está en uso');
    expect(userField).toHaveAttribute('aria-invalid', 'true');
    expect(userField).toHaveFocus();
    expect(screen.getByLabelText(es.auth.passwordConfirmation)).toHaveAccessibleDescription(
      'no coincide',
    );
    expect(screen.getByLabelText(es.auth.email)).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('heading', { name: es.register.title })).toBeInTheDocument();
  });

  it('muestra todos los errores juntos: los de campo en su campo y los generales en un aviso', async () => {
    mockFetch(
      jsonResponse(
        422,
        apiErrors(
          ['email', 'ya está en uso'],
          ['email', 'no es un dominio permitido'],
          ['password', 'es demasiado común'],
          ['base', 'No se pudo crear la cuenta'],
          ['terms', 'tienen que aceptarse'],
        ),
      ),
    );
    const { user } = renderApp(ROUTES.REGISTER);

    await fillAndSubmit(user);

    const email = screen.getByLabelText(es.auth.email);
    expect(await screen.findByText('ya está en uso')).toBeInTheDocument();
    expect(email).toHaveAccessibleDescription('ya está en uso no es un dominio permitido');
    expect(email).toHaveFocus();
    expect(screen.getByLabelText(es.auth.password)).toHaveAccessibleDescription(
      expect.stringContaining('es demasiado común'),
    );

    // "base" y un campo que el formulario no tiene van juntos en el aviso flotante.
    const toast = screen
      .getAllByRole('alert')
      .find((alert) => alert.textContent.includes('No se pudo crear la cuenta'));
    expect(toast).toHaveTextContent('tienen que aceptarse');
    expect(screen.getByRole('button', { name: es.common.close })).toBeInTheDocument();
  });

  it.each([
    [403, es.errors.forbidden],
    [404, es.errors.notFound],
    [422, es.errors.validation],
    [500, es.errors.generic],
  ])(
    'si la API responde %i sin mensajes, avisa un mensaje claro y lo registra',
    async (status, message) => {
      mockFetch(jsonResponse(status));
      const { user } = renderApp(ROUTES.REGISTER);

      await fillAndSubmit(user);

      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(logError).toHaveBeenCalledWith(expect.objectContaining({ status }));
      expect(screen.getByRole('heading', { name: es.register.title })).toBeInTheDocument();
    },
  );

  it('valida email, largo de la contraseña y confirmación antes de enviar', async () => {
    const fetchMock = mockFetch();
    const { user } = renderApp(ROUTES.REGISTER);

    await fillAndSubmit(user, {
      user: 'nico',
      email: 'nico@',
      password: 'corta',
      passwordConfirmation: 'otra',
    });

    expect(screen.getByLabelText(es.auth.email)).toHaveAccessibleDescription(es.validation.email);
    expect(screen.getByLabelText(es.auth.email)).toHaveFocus();
    expect(screen.getByLabelText(es.auth.password)).toHaveAccessibleDescription(
      expect.stringContaining(String(PASSWORD_MIN_LENGTH)),
    );
    expect(screen.getByLabelText(es.auth.passwordConfirmation)).toHaveAccessibleDescription(
      es.validation.passwordMismatch,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
