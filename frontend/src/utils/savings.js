// Agrupa los meses ('YYYY-MM') por año, del más reciente al más antiguo; dentro de cada año, los
// meses van como llegan (del más antiguo al más reciente). Cada año trae sus totales de ingresos,
// consumo y ahorro.
export function groupByYear(months) {
  const years = new Map();

  for (const month of months) {
    const year = Number(month.month.slice(0, 4));
    const entry = years.get(year) ?? { year, months: [], income: 0, consumption: 0, savings: 0 };
    entry.months.push(month);
    entry.income += month.income;
    entry.consumption += month.consumption;
    entry.savings += month.savings;
    years.set(year, entry);
  }

  return [...years.values()].toSorted((a, b) => b.year - a.year);
}
