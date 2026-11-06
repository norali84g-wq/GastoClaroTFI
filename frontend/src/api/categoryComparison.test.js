import { fetchCall, jsonResponse, mockFetch } from '../test/api';
import { getCategoryComparison } from './categoryComparison';

describe('estimado contra real de una categoría', () => {
  it('pide el mes, convierte los montos a número y pasa los campos a camelCase', async () => {
    const fetchMock = mockFetch(
      jsonResponse(200, {
        category: { id: 5, name: 'Comida' },
        period: '2026-09',
        planned_total: '100.0',
        real_total: '190.0',
        subcategories: [
          {
            category: { id: 6, name: 'Verduras' },
            planned: '100.0',
            real: '150.0',
            over_budget: true,
          },
        ],
        items: [
          {
            name: 'Arroz',
            planned_quantity: '2.0',
            planned_unit_price: '100.0',
            planned_total: '200.0',
            real_quantity: 3,
            real_unit_price: '90.0',
            real_total: '270.0',
            status: 'bought',
          },
        ],
      }),
    );

    expect(await getCategoryComparison({ categoryId: 5, period: '2026-09' })).toEqual({
      category: { id: 5, name: 'Comida' },
      period: '2026-09',
      plannedTotal: 100,
      realTotal: 190,
      subcategories: [{ id: 6, name: 'Verduras', planned: 100, real: 150, overBudget: true }],
      items: [
        {
          name: 'Arroz',
          plannedQuantity: 2,
          plannedUnitPrice: 100,
          plannedTotal: 200,
          realQuantity: 3,
          realUnitPrice: 90,
          realTotal: 270,
          status: 'bought',
        },
      ],
    });
    expect(fetchCall(fetchMock).url).toMatch(/\/categories\/5\/comparison\?period=2026-09$/);
  });
});
