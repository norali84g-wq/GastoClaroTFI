import { api } from './client';

const ENDPOINTS = {
  DASHBOARD: '/dashboard',
};

// Hacia adentro de la app el resumen es { period, income, consumption, savings,
// savingsGoalPercentage, consumptionByCategory: [{ category, total, planned }], monthlySavings: [{ month,
// income, consumption, savings, accumulated }] }. Los montos llegan como texto ("450000.0") y acá
// pasan a número. El listado de ingresos del mes (`incomes`) no se usa en el panel: no se pasa.
function normalizeDashboard(raw) {
  return {
    period: raw.period,
    income: Number(raw.income),
    consumption: Number(raw.consumption),
    savings: Number(raw.savings),
    savingsGoalPercentage: raw.savings_goal_percentage,
    consumptionByCategory: raw.consumption_by_category.map(
      ({ category_id: categoryId, category, total, planned }) => ({
        categoryId: categoryId ?? null,
        category,
        total: Number(total),
        planned: Number(planned ?? 0),
      }),
    ),
    monthlySavings: raw.monthly_savings.map((month) => ({
      month: month.month,
      income: Number(month.income),
      consumption: Number(month.consumption),
      savings: Number(month.savings),
      accumulated: Number(month.accumulated),
    })),
  };
}

// Resumen del mes en curso del usuario del token. Se cumple siempre: income = consumption + savings.
export async function getDashboard({ signal } = {}) {
  return normalizeDashboard(await api.get(ENDPOINTS.DASHBOARD, { signal }));
}
