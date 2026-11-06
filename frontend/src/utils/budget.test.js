import { BUDGET_STATUS, budgetStatus } from './budget';

describe('estado del consumo frente a lo planificado', () => {
  it('sin plan, no hay estado', () => {
    expect(budgetStatus(500, 0)).toBe(BUDGET_STATUS.NONE);
  });

  it('por debajo del umbral, está dentro del plan', () => {
    expect(budgetStatus(79, 100)).toBe(BUDGET_STATUS.OK);
  });

  it('desde el umbral hasta el monto exacto, avisa que está cerca', () => {
    expect(budgetStatus(80, 100)).toBe(BUDGET_STATUS.NEAR);
    expect(budgetStatus(100, 100)).toBe(BUDGET_STATUS.NEAR);
  });

  it('por encima del monto planificado, avisa que se superó', () => {
    expect(budgetStatus(101, 100)).toBe(BUDGET_STATUS.OVER);
  });
});
