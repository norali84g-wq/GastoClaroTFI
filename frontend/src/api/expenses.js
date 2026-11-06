import { ApiError, api } from './client';

const ENDPOINTS = {
  EXPENSES: '/expenses',
};

// El back puede informar la categoría inexistente con field "category" en vez de "category_id".
// Se pidió normalizarlo, pero puede que todavía no esté: este es el único lugar que lo traduce,
// para que el error aparezca en el campo de la categoría en los dos casos.
const API_FIELD_ALIASES = { category: 'category_id' };

// Hacia adentro de la app un gasto es { id, amount, date, description, isFixed, purchaseChannel,
// category: { id, name }, items: [{ id, name, quantity, unit, unitPrice, subtotal }] }. Los montos
// llegan como texto ("13101.0") y acá pasan a número, para que nadie más tenga que convertirlos.
// Si un gasto tiene ítems, amount ya es su total. vendor_id quedó fuera del TP2: no se pasa.
function normalizeExpense(raw) {
  return {
    id: raw.id,
    amount: Number(raw.amount),
    date: raw.date,
    description: raw.description ?? '',
    isFixed: Boolean(raw.is_fixed),
    purchaseChannel: raw.purchase_channel ?? null,
    category: raw.category ? { id: raw.category.id, name: raw.category.name } : null,
    items: (raw.expense_items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
  };
}

function normalizeErrorFields(error) {
  if (
    !(error instanceof ApiError) ||
    !error.errors.some(({ field }) => field in API_FIELD_ALIASES)
  ) {
    return error;
  }
  const errors = error.errors.map((item) => ({
    ...item,
    field: API_FIELD_ALIASES[item.field] ?? item.field,
  }));
  return new ApiError(error.status, errors, { cause: error });
}

// Hace el pedido y, si falla, normaliza los nombres de campo del error.
async function send(request) {
  try {
    return normalizeExpense(await request());
  } catch (error) {
    throw normalizeErrorFields(error);
  }
}

// Ítems de una edición, con la forma que pide la API: uno que se quita va solo con su id y
// _destroy; uno que se modifica, con su id y también su name (sin name, la API lo descarta en
// silencio).
function toItemAttributes(items) {
  return items.map((item) =>
    item.destroy
      ? { id: item.id, _destroy: true }
      : {
          id: item.id,
          name: item.name.trim(),
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
        },
  );
}

// Gastos del usuario del token, del más reciente al más antiguo (como máximo 100). `period` es
// 'YYYY-MM'.
export async function listExpenses({ period, signal } = {}) {
  const query = period ? `?${new URLSearchParams({ period })}` : '';
  const expenses = await api.get(`${ENDPOINTS.EXPENSES}${query}`, { signal });
  return expenses.map(normalizeExpense);
}

// Recibe el gasto con los tipos de la app (amount y categoryId como números). La descripción viaja
// sin espacios en los extremos; los campos opcionales vacíos no se mandan. Devuelve el gasto creado.
export async function createExpense({
  date,
  categoryId,
  amount,
  description = '',
  isFixed = false,
  purchaseChannel = '',
}) {
  const body = { date, category_id: categoryId, amount, is_fixed: isFixed };
  if (description.trim()) body.description = description.trim();
  if (purchaseChannel) body.purchase_channel = purchaseChannel;

  return send(() => api.post(ENDPOINTS.EXPENSES, body));
}

// Edita un gasto con los mismos tipos que createExpense, más `items`: los del gasto, cada uno
// modificado ({ id, name, quantity, unit, unitPrice }) o para quitar ({ id, destroy: true }).
// - La descripción se manda siempre, aunque esté vacía: así se puede borrar.
// - amount se manda solo si no queda ningún ítem: con ítems, la API calcula el monto y gana el
//   suyo; si se quitan todos, sin amount el gasto conservaría el monto anterior.
// - purchase_channel vacío no se manda: la API no acepta dejarlo sin canal.
// Devuelve el gasto actualizado. Un 404 significa que no existe o no es del usuario.
export async function updateExpense(
  id,
  { date, categoryId, amount, description = '', isFixed = false, purchaseChannel = '', items = [] },
) {
  const body = {
    date,
    category_id: categoryId,
    description: description.trim(),
    is_fixed: isFixed,
  };
  if (purchaseChannel) body.purchase_channel = purchaseChannel;
  if (items.every((item) => item.destroy)) body.amount = amount;
  if (items.length > 0) body.expense_items_attributes = toItemAttributes(items);

  return send(() => api.patch(`${ENDPOINTS.EXPENSES}/${id}`, body));
}

// Borra el gasto y sus ítems. Un 404 significa que no existe o no es del usuario.
export async function deleteExpense(id) {
  await api.delete(`${ENDPOINTS.EXPENSES}/${id}`);
}
