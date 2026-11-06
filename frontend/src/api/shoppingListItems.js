import { api } from './client';

const ENDPOINTS = {
  SHOPPING_LIST_ITEMS: '/shopping_list_items',
};

// Hacia adentro de la app un ítem de la lista de gastos fijos es { id, name, period, quantity,
// estimatedUnitPrice, subtotal, categoryId, categoryName }. Los montos llegan como texto ("1500.0")
// y acá pasan a número. `quantity` es null si no se cargó. El subtotal lo calcula la API.
function normalizeShoppingListItem(raw) {
  return {
    id: raw.id,
    name: raw.name,
    period: raw.period,
    quantity: raw.quantity === null || raw.quantity === undefined ? null : Number(raw.quantity),
    estimatedUnitPrice: Number(raw.estimated_unit_price),
    subtotal: Number(raw.subtotal),
    categoryId: raw.category?.id ?? null,
    categoryName: raw.category?.name ?? null,
  };
}

// Recibe el ítem con los tipos de la app. El nombre viaja sin espacios en los extremos.
function toApiBody({ name, period, quantity, estimatedUnitPrice, categoryId }) {
  return {
    name: name.trim(),
    period,
    quantity,
    estimated_unit_price: estimatedUnitPrice,
    category_id: categoryId,
  };
}

// Ítems del usuario, ordenados por mes y nombre.
export async function listShoppingListItems({ signal } = {}) {
  const items = await api.get(ENDPOINTS.SHOPPING_LIST_ITEMS, { signal });
  return items.map(normalizeShoppingListItem);
}

// Devuelve el ítem creado, con el subtotal ya calculado.
export async function createShoppingListItem(item) {
  return normalizeShoppingListItem(await api.post(ENDPOINTS.SHOPPING_LIST_ITEMS, toApiBody(item)));
}

// Manda todos los campos del formulario. Devuelve el ítem con el subtotal recalculado.
export async function updateShoppingListItem(id, item) {
  return normalizeShoppingListItem(
    await api.patch(`${ENDPOINTS.SHOPPING_LIST_ITEMS}/${id}`, toApiBody(item)),
  );
}

export async function deleteShoppingListItem(id) {
  await api.delete(`${ENDPOINTS.SHOPPING_LIST_ITEMS}/${id}`);
}
