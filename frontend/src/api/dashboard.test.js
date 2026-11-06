import { apiDashboard, fetchCall, jsonResponse, mockFetch } from '../test/api';
import { getDashboard } from './dashboard';

describe('resumen del panel', () => {
  it('convierte los montos a número, pasa los campos a camelCase y deja afuera los ingresos', async () => {
    const fetchMock = mockFetch(
      jsonResponse(
        200,
        apiDashboard({
          period: '2026-09',
          income: '450000.0',
          consumption: '38101.0',
          savings: '411899.0',
          savings_goal_percentage: 10,
          incomes: [
            { id: 1, user: { id: 1, user: 'nico' }, amount: '450000.0', date: '2026-09-01' },
          ],
          consumption_by_category: [
            { category_id: 2, category: 'Limpieza', total: '25000.0', planned: '30000.0' },
          ],
          monthly_savings: [
            {
              month: '2026-09',
              income: '450000.0',
              consumption: '38101.0',
              savings: '411899.0',
              accumulated: '411899.0',
            },
          ],
        }),
      ),
    );

    expect(await getDashboard()).toEqual({
      period: '2026-09',
      income: 450000,
      consumption: 38101,
      savings: 411899,
      savingsGoalPercentage: 10,
      consumptionByCategory: [
        { categoryId: 2, category: 'Limpieza', total: 25000, planned: 30000 },
      ],
      monthlySavings: [
        {
          month: '2026-09',
          income: 450000,
          consumption: 38101,
          savings: 411899,
          accumulated: 411899,
        },
      ],
    });
    expect(fetchCall(fetchMock).url).toMatch(/\/dashboard$/);
  });

  it('acepta los totales en cero que el back manda como número', async () => {
    mockFetch(jsonResponse(200, apiDashboard({ income: 0, consumption: 0, savings: 0 })));

    expect(await getDashboard()).toMatchObject({ income: 0, consumption: 0, savings: 0 });
  });
});
