// Lo que se paga por mes en cada categoría (por ejemplo, cada tarjeta) por las compras en cuotas
// que todavía tienen cuotas por pagar. `categories` son las que ofrece la API: { id, name }. Va de
// la categoría en la que más se paga al mes a la que menos.
export function summarizeByCategory(purchases, categories) {
  const names = new Map(categories.map(({ id, name }) => [id, name]));
  const totals = new Map();

  for (const purchase of purchases) {
    if (purchase.remainingInstallments <= 0) continue;
    const current = totals.get(purchase.categoryId) ?? { count: 0, monthlyAmount: 0 };
    totals.set(purchase.categoryId, {
      count: current.count + 1,
      monthlyAmount: current.monthlyAmount + purchase.installmentAmount,
    });
  }

  return [...totals]
    .map(([categoryId, { count, monthlyAmount }]) => ({
      categoryId,
      name: names.get(categoryId) ?? null,
      count,
      monthlyAmount,
    }))
    .toSorted((a, b) => b.monthlyAmount - a.monthlyAmount);
}
