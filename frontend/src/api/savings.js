import { api } from './client';

const ENDPOINTS = {
  SAVINGS: '/savings',
};

// Hacia adentro de la app el ahorro es { savingsGoalPercentage, months: [{ month, income,
// consumption, savings, accumulated }] }, del mes más antiguo al más reciente. Los montos llegan
// como texto ("450000.0") y acá pasan a número. El ahorro y el acumulado los calcula la API.
function normalizeSavings(raw) {
  return {
    savingsGoalPercentage: raw.savings_goal_percentage,
    months: raw.months.map((month) => ({
      month: month.month,
      income: Number(month.income),
      consumption: Number(month.consumption),
      savings: Number(month.savings),
      accumulated: Number(month.accumulated),
    })),
  };
}

// Ahorro mes a mes desde el primer movimiento hasta el mes en curso.
export async function getSavings({ signal } = {}) {
  return normalizeSavings(await api.get(ENDPOINTS.SAVINGS, { signal }));
}
