import { BUDGET_WARNING_RATIO } from '../config/constants';

export const BUDGET_STATUS = {
  NONE: 'none',
  OK: 'ok',
  NEAR: 'near',
  OVER: 'over',
};

// Cómo viene el consumo de una categoría respecto de lo planificado: sin plan, dentro del plan,
// cerca del monto o por encima.
export function budgetStatus(spent, planned) {
  if (planned <= 0) return BUDGET_STATUS.NONE;
  const ratio = spent / planned;
  if (ratio > 1) return BUDGET_STATUS.OVER;
  if (ratio >= BUDGET_WARNING_RATIO) return BUDGET_STATUS.NEAR;
  return BUDGET_STATUS.OK;
}
