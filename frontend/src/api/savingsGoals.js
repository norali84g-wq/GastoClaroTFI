import { api } from './client';

const ENDPOINTS = {
  SAVINGS_GOALS: '/savings_goals',
};

// Hacia adentro de la app una meta es { id, name, targetAmount, savedAmount, deadline,
// progressPercentage }. Los montos llegan como texto ("800.0") y acá pasan a número. `deadline` es
// 'YYYY-MM-DD' o null si la meta no tiene fecha límite. El porcentaje de avance lo calcula la API:
// el front ni lo calcula ni lo guarda.
function normalizeSavingsGoal(raw) {
  return {
    id: raw.id,
    name: raw.name,
    targetAmount: Number(raw.target_amount),
    savedAmount: Number(raw.saved_amount),
    deadline: raw.deadline ?? null,
    progressPercentage: raw.progress_percentage,
  };
}

// Recibe la meta con los tipos de la app y arma el cuerpo que espera la API. El nombre viaja sin
// espacios en los extremos.
function toBody({ name, targetAmount, savedAmount, deadline }) {
  return {
    name: name.trim(),
    target_amount: targetAmount,
    saved_amount: savedAmount,
    deadline,
  };
}

// Metas del usuario, de la más reciente a la más antigua.
export async function listSavingsGoals({ signal } = {}) {
  const goals = await api.get(ENDPOINTS.SAVINGS_GOALS, { signal });
  return goals.map(normalizeSavingsGoal);
}

// Devuelve la meta creada.
export async function createSavingsGoal(goal) {
  return normalizeSavingsGoal(await api.post(ENDPOINTS.SAVINGS_GOALS, toBody(goal)));
}

// Devuelve la meta actualizada, con el porcentaje de avance recalculado.
export async function updateSavingsGoal(id, goal) {
  return normalizeSavingsGoal(await api.patch(`${ENDPOINTS.SAVINGS_GOALS}/${id}`, toBody(goal)));
}

export async function deleteSavingsGoal(id) {
  await api.delete(`${ENDPOINTS.SAVINGS_GOALS}/${id}`);
}
