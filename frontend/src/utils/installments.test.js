import { summarizeByCategory } from './installments';

const CATEGORIES = [
  { id: 1, name: 'Visa' },
  { id: 2, name: 'Mastercard' },
];

function purchase(overrides) {
  return { categoryId: 1, installmentAmount: 100, remainingInstallments: 3, ...overrides };
}

describe('resumen de cuotas por categoría', () => {
  it('suma lo que se paga por mes en cada categoría, de mayor a menor', () => {
    const summary = summarizeByCategory(
      [
        purchase(),
        purchase({ installmentAmount: 50 }),
        purchase({ categoryId: 2, installmentAmount: 400 }),
      ],
      CATEGORIES,
    );

    expect(summary).toEqual([
      { categoryId: 2, name: 'Mastercard', count: 1, monthlyAmount: 400 },
      { categoryId: 1, name: 'Visa', count: 2, monthlyAmount: 150 },
    ]);
  });

  it('no cuenta las compras que ya no tienen cuotas por pagar', () => {
    expect(summarizeByCategory([purchase({ remainingInstallments: 0 })], CATEGORIES)).toEqual([]);
  });

  it('una categoría que ya no está en la lista queda sin nombre', () => {
    const [item] = summarizeByCategory([purchase({ categoryId: 99 })], CATEGORIES);

    expect(item.name).toBeNull();
  });
});
