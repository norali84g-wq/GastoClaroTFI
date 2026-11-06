import { fetchCall, jsonResponse, mockFetch, TEST_TOKEN, TEST_USER } from '../test/api';
import { login, register } from './auth';

describe('auth', () => {
  it('login devuelve el token y el usuario, sin los campos que la app no usa', async () => {
    mockFetch(
      jsonResponse(200, {
        token: TEST_TOKEN,
        expires_at: '2026-10-28T03:14:00Z',
        user: { ...TEST_USER, created_at: '2026-10-01T12:00:00Z' },
      }),
    );

    expect(await login({ user: 'nico', password: 'clave1234' })).toEqual({
      token: TEST_TOKEN,
      user: TEST_USER,
    });
  });

  it('register devuelve el usuario con la misma forma que GET /me', async () => {
    mockFetch(
      jsonResponse(201, { token: TEST_TOKEN, expires_at: '2026-10-28T03:14:00Z', user: TEST_USER }),
    );

    const session = await register({
      user: 'nico',
      email: 'nico@example.com',
      password: 'clave1234',
      passwordConfirmation: 'clave1234',
    });

    expect(session).toEqual({ token: TEST_TOKEN, user: TEST_USER });
  });

  it('recorta los espacios de usuario y email pero no los de la contraseña', async () => {
    const fetchMock = mockFetch(
      jsonResponse(201, { token: TEST_TOKEN, user: TEST_USER }),
      jsonResponse(200, { token: TEST_TOKEN, user: TEST_USER }),
    );

    await register({
      user: '  nico  ',
      email: ' nico@example.com ',
      password: ' clave1234 ',
      passwordConfirmation: ' clave1234 ',
    });
    await login({ user: 'nico  ', password: ' clave1234 ' });

    expect(fetchCall(fetchMock, 0).body).toEqual({
      user: 'nico',
      email: 'nico@example.com',
      password: ' clave1234 ',
      password_confirmation: ' clave1234 ',
    });
    expect(fetchCall(fetchMock, 1).body).toEqual({ user: 'nico', password: ' clave1234 ' });
  });
});
