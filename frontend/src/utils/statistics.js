// Los meses ordenados de mayor a menor según `key` (consumption, savings o unplanned), con un
// tope. Un mes con valor 0 o negativo no entra: no es un "mes de mayor" nada.
export function rankMonths(months, key, limit = 5) {
  return months
    .filter((month) => month[key] > 0)
    .toSorted((a, b) => b[key] - a[key])
    .slice(0, limit);
}
