import { rankMonths } from './statistics';

const MONTHS = [
  { month: '2026-07', consumption: 100, savings: 50, unplanned: 0 },
  { month: '2026-08', consumption: 300, savings: -20, unplanned: 15 },
  { month: '2026-09', consumption: 200, savings: 80, unplanned: 5 },
];

describe('rankMonths', () => {
  it('ordena de mayor a menor según el campo', () => {
    expect(rankMonths(MONTHS, 'consumption').map(({ month }) => month)).toEqual([
      '2026-08',
      '2026-09',
      '2026-07',
    ]);
  });

  it('deja afuera los meses con valor 0 o negativo', () => {
    expect(rankMonths(MONTHS, 'savings').map(({ month }) => month)).toEqual(['2026-09', '2026-07']);
    expect(rankMonths(MONTHS, 'unplanned').map(({ month }) => month)).toEqual([
      '2026-08',
      '2026-09',
    ]);
  });

  it('respeta el tope', () => {
    expect(rankMonths(MONTHS, 'consumption', 1)).toHaveLength(1);
  });
});
