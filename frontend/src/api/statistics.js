import { api } from './client';

const ENDPOINTS = {
  STATISTICS: '/statistics',
};

function categoryRow(row) {
  return {
    id: row.category.id,
    name: row.category.name,
    real: Number(row.real),
    planned: Number(row.planned),
    overBudget: row.over_budget,
    percentage: Number(row.percentage),
  };
}

// Hacia adentro de la app las estadísticas son { year, month, availableYears, months: [{ month,
// income, consumption, savings, unplanned }], byCategory: [{ id, name, total, percentage,
// subcategories: [...] }], unplanned: { total, byVendor: [{ vendor, total }], items: [...] } }.
// Los montos llegan como texto y acá pasan a número. El gasto hormiga es lo que se compró sin estar
// en la lista de gastos fijos del mes.
function normalizeStatistics(raw) {
  return {
    year: raw.year,
    month: raw.month ?? null,
    availableYears: raw.available_years,
    months: raw.months.map((row) => ({
      month: row.month,
      income: Number(row.income),
      consumption: Number(row.consumption),
      savings: Number(row.savings),
      unplanned: Number(row.unplanned),
    })),
    byCategory: raw.by_category.map((group) => ({
      id: group.category.id,
      name: group.category.name,
      total: Number(group.total),
      percentage: Number(group.percentage),
      subcategories: group.subcategories.map(categoryRow),
    })),
    unplanned: {
      total: Number(raw.unplanned.total),
      byVendor: raw.unplanned.by_vendor.map((row) => ({
        vendor: row.vendor ?? null,
        total: Number(row.total),
      })),
      items: raw.unplanned.items.map((item) => ({
        name: item.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
        date: item.date,
        vendor: item.vendor ?? null,
      })),
    },
  };
}

// Estadísticas del año (y, si se pasa, de un mes de ese año).
export async function getStatistics({ year, month, signal } = {}) {
  const query = new URLSearchParams({ year: String(year) });
  if (month) query.set('month', String(month));
  return normalizeStatistics(await api.get(`${ENDPOINTS.STATISTICS}?${query}`, { signal }));
}
