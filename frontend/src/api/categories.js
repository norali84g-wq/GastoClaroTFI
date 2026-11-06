import { api } from './client';

const ENDPOINTS = {
  CATEGORIES: '/categories',
};

// Para elegir una categoría: su id, su nombre y si es una tarjeta (tracksInstallments: las compras en
// cuotas se cargan en las categorías que lo son). Vienen ordenadas por nombre.
export async function listCategories({ signal } = {}) {
  const categories = await api.get(ENDPOINTS.CATEGORIES, { signal });
  return categories.map(({ id, name, tracks_installments: tracksInstallments }) => ({
    id,
    name,
    tracksInstallments: Boolean(tracksInstallments),
  }));
}

// Para la pantalla de categorías: además, a qué categoría pertenece cada una (parentId, null si es
// principal).
function normalizeCategory({ id, name, parent_id: parentId, tracks_installments: tracks }) {
  return { id, name, parentId: parentId ?? null, tracksInstallments: Boolean(tracks) };
}

export async function listCategoryDetails({ signal } = {}) {
  const categories = await api.get(ENDPOINTS.CATEGORIES, { signal });
  return categories.map(normalizeCategory);
}

// Solo el administrador puede crear y editar categorías: las comparten todos los usuarios.
function toBody({ name, parentId, tracksInstallments }) {
  return { name: name.trim(), parent_id: parentId, tracks_installments: tracksInstallments };
}

export async function createCategory(category) {
  return normalizeCategory(await api.post(ENDPOINTS.CATEGORIES, toBody(category)));
}

export async function updateCategory(id, category) {
  return normalizeCategory(await api.patch(`${ENDPOINTS.CATEGORIES}/${id}`, toBody(category)));
}

// Solo se borra una categoría sin uso: con gastos, cuotas, gastos fijos o subcategorías la API
// responde 422 con el motivo.
export async function deleteCategory(id) {
  await api.delete(`${ENDPOINTS.CATEGORIES}/${id}`);
}
