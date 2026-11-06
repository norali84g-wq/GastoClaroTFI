import { api } from './client';

const ENDPOINTS = {
  INCOMES: '/incomes',
};

// Hacia adentro de la app un ingreso es { id, amount, date }. El monto llega como texto
// ("450000.0") y acá pasa a número, para que nadie más tenga que convertirlo. El usuario dueño
// del ingreso (user) no se pasa: la pantalla muestra solo los del usuario de la sesión.
function normalizeIncome(raw) {
  return {
    id: raw.id,
    amount: Number(raw.amount),
    date: raw.date,
  };
}

// Ingresos del usuario del token, del más reciente al más antiguo.
export async function listIncomes({ signal } = {}) {
  const incomes = await api.get(ENDPOINTS.INCOMES, { signal });
  return incomes.map(normalizeIncome);
}

// Recibe el ingreso con los tipos de la app (amount como número, date 'YYYY-MM-DD'). Devuelve el
// ingreso creado. El dueño lo pone la API según el token.
export async function createIncome({ amount, date }) {
  return normalizeIncome(await api.post(ENDPOINTS.INCOMES, { amount, date }));
}

// Cambia un ingreso: recibe los mismos campos que createIncome y devuelve el ingreso actualizado.
// La API responde 404 si ya no existe o no es del usuario.
export async function updateIncome(id, { amount, date }) {
  return normalizeIncome(await api.patch(`${ENDPOINTS.INCOMES}/${id}`, { amount, date }));
}

// Borra un ingreso. La API responde 204, sin cuerpo.
export async function deleteIncome(id) {
  await api.delete(`${ENDPOINTS.INCOMES}/${id}`);
}
