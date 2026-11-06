import { api } from './client';

const ENDPOINTS = {
  USERS: '/users',
};

// Usuarios registrados, por id. Solo los puede pedir el administrador (con otro usuario, 403). Cada
// uno es { id, user, email, admin }, con email en null si no tiene.
export async function listUsers({ signal } = {}) {
  const users = await api.get(ENDPOINTS.USERS, { signal });
  return users.map(({ id, user, email, admin }) => ({
    id,
    user,
    email: email ?? null,
    admin: Boolean(admin),
  }));
}
