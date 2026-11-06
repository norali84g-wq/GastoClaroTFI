import { fetchCall, jsonResponse, mockFetch } from '../test/api';
import { getStatistics } from './statistics';

const RAW = {
  year: 2026,
  month: 9,
  available_years: [2026, 2025],
  months: [
    {
      month: '2026-09',
      income: '500.0',
      consumption: '700.0',
      savings: '-200.0',
      unplanned: '70.0',
    },
  ],
  by_category: [
    {
      category: { id: 5, name: 'Comida' },
      total: '200.0',
      percentage: 66.7,
      subcategories: [
        {
          category: { id: 6, name: 'Verduras' },
          real: '150.0',
          planned: '100.0',
          over_budget: true,
          percentage: 50.0,
        },
      ],
    },
  ],
  unplanned: {
    total: '70.0',
    by_vendor: [
      { vendor: 'Coto', total: '60.0' },
      { vendor: null, total: '10.0' },
    ],
    items: [
      {
        name: 'Cafe',
        quantity: 2,
        unit_price: '30.0',
        subtotal: '60.0',
        date: '2026-09-05',
        category_id: 4,
        vendor: 'Coto',
      },
    ],
  },
};

describe('estadísticas', () => {
  it('pide el año y el mes, convierte los montos a número y pasa los campos a camelCase', async () => {
    const fetchMock = mockFetch(jsonResponse(200, RAW));

    const statistics = await getStatistics({ year: 2026, month: 9 });

    expect(statistics.availableYears).toEqual([2026, 2025]);
    expect(statistics.months).toEqual([
      { month: '2026-09', income: 500, consumption: 700, savings: -200, unplanned: 70 },
    ]);
    expect(statistics.byCategory[0]).toMatchObject({
      id: 5,
      name: 'Comida',
      total: 200,
      percentage: 66.7,
    });
    expect(statistics.byCategory[0].subcategories[0]).toEqual({
      id: 6,
      name: 'Verduras',
      real: 150,
      planned: 100,
      overBudget: true,
      percentage: 50,
    });
    expect(statistics.unplanned.total).toBe(70);
    expect(statistics.unplanned.byVendor).toEqual([
      { vendor: 'Coto', total: 60 },
      { vendor: null, total: 10 },
    ]);
    expect(statistics.unplanned.items[0]).toMatchObject({
      name: 'Cafe',
      unitPrice: 30,
      subtotal: 60,
    });
    expect(fetchCall(fetchMock).url).toMatch(/\/statistics\?year=2026&month=9$/);
  });

  it('sin mes, pide solo el año', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { ...RAW, month: null }));

    const statistics = await getStatistics({ year: 2026, month: null });

    expect(statistics.month).toBeNull();
    expect(fetchCall(fetchMock).url).toMatch(/\/statistics\?year=2026$/);
  });
});
