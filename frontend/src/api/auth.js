import { api } from './client';

// Las rutas cuelgan directo de la URL base (/api/v1), sin prefijo.
const ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register',
  LOGOUT: '/logout',
  ME: '/me',
};

// Hacia adentro de la app el usuario es siempre { id, user, email, admin }, la misma forma que
// devuelven GET /me, login y register. Lo que la API no trae queda en null.
function normalizeUser({ id = null, user = null, email = null, admin = null }) {
  return { id, user, email, admin };
}

function normalizeSession({ token, user }) {
  return { token, user: normalizeUser(user) };
}

// Usuario y email viajan sin espacios en los extremos; la contraseña va tal cual se escribió.

// Devuelve { token, user }.
export async function login({ user, password }) {
  return normalizeSession(await api.post(ENDPOINTS.LOGIN, { user: user.trim(), password }));
}

// Devuelve { token, user }.
export async function register({ user, email, password, passwordConfirmation }) {
  const session = await api.post(ENDPOINTS.REGISTER, {
    user: user.trim(),
    email: email.trim(),
    password,
    password_confirmation: passwordConfirmation,
  });
  return normalizeSession(session);
}

// Responde 204 sin cuerpo. Recibe el token explícito porque quien la llama ya borró la sesión
// local antes de avisarle al servidor.
export function logout(token) {
  return api.delete(ENDPOINTS.LOGOUT, { token });
}

// Devuelve el usuario del token.
export async function me({ signal } = {}) {
  return normalizeUser(await api.get(ENDPOINTS.ME, { signal }));
}
