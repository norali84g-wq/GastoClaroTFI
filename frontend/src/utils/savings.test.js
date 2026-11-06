import { groupByYear } from './savings';

function month(period, income, consumption) {
  return { month: period, income, consumption, savings: income - consumption, accumulated: 0 };
}

describe('ahorro agrupado por año', () => {
  it('agrupa por año, del más reciente al más antiguo, y suma los totales de cada uno', () => {
    const years = groupByYear([
      month('2025-12', 100, 40),
      month('2026-01', 200, 50),
      month('2026-02', 300, 400),
    ]);

    expect(years.map(({ year }) => year)).toEqual([2026, 2025]);
    expect(years[0].months.map(({ month: period }) => period)).toEqual(['2026-01', '2026-02']);
    expect(years[0]).toMatchObject({ income: 500, consumption: 450, savings: 50 });
    expect(years[1]).toMatchObject({ income: 100, consumption: 40, savings: 60 });
  });

  it('sin meses, no hay años', () => {
    expect(groupByYear([])).toEqual([]);
  });
});
