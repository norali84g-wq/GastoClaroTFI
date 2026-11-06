import { describe, expect, it } from 'vitest';
import { pickAdvice } from './advice';

// Un traductor de prueba que devuelve la clave, para comprobar qué consejo se eligió.
const t = (key) => key;
const summary = (overrides = {}) => ({
  income: 100000,
  consumption: 30000,
  savings: 70000,
  consumptionByCategory: [],
  ...overrides,
});

describe('pickAdvice', () => {
  it('avisa primero si se superó lo planificado', () => {
    const result = pickAdvice(
      summary({ consumptionByCategory: [{ category: 'Servicios', total: 60, planned: 50 }] }),
      [],
      t,
    );
    expect(result).toEqual({ tone: 'alert', text: 'dashboard.advice.over' });
  });

  it('avisa si se está cerca de lo planificado', () => {
    const result = pickAdvice(
      summary({ consumptionByCategory: [{ category: 'Servicios', total: 45, planned: 50 }] }),
      [],
      t,
    );
    expect(result.tone).toBe('warning');
    expect(result.text).toBe('dashboard.advice.near');
  });

  it('avisa si el consumo es alto respecto de los ingresos', () => {
    const result = pickAdvice(summary({ consumption: 85000, savings: 15000 }), [], t);
    expect(result.text).toBe('dashboard.advice.highConsumption');
  });

  it('felicita si el ahorro es bueno', () => {
    const result = pickAdvice(summary(), [{ id: 1 }], t);
    expect(result).toEqual({ tone: 'success', text: 'dashboard.advice.goodSavings' });
  });

  it('sugiere crear una meta si no hay ninguna', () => {
    const result = pickAdvice(summary(), [], t);
    expect(result.text).toBe('dashboard.advice.noGoals');
  });
});
