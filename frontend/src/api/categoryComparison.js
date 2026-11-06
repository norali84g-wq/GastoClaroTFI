import { api } from './client';

const ENDPOINTS = {
  CATEGORIES: '/categories',
};

// Estado de un producto al comparar lo estimado con lo real (los códigos que manda la API).
export const PRODUCT_STATUS = {
  BOUGHT: 'bought',
  UNPLANNED: 'unplanned',
  NOT_BOUGHT: 'not_bought',
};

// Hacia adentro de la app la comparación es { category: { id, name }, period, plannedTotal,
// realTotal, subcategories: [{ id, name, planned, real, overBudget }], items: [{ name,
// plannedQuantity, plannedUnitPrice, plannedTotal, realQuantity, realUnitPrice, realTotal,
// status }] }. Los montos llegan como texto ("1500.0") y acá pasan a número. Una categoría con
// subcategorías trae filas en `subcategories` y `items` vacío; una sin subcategorías, al revés.
function normalizeComparison(raw) {
  return {
    category: { id: raw.category.id, name: raw.category.name },
    period: raw.period,
    plannedTotal: Number(raw.planned_total),
    realTotal: Number(raw.real_total),
    subcategories: raw.subcategories.map((row) => ({
      id: row.category.id,
      name: row.category.name,
      planned: Number(row.planned),
      real: Number(row.real),
      overBudget: row.over_budget,
    })),
    items: raw.items.map((item) => ({
      name: item.name,
      plannedQuantity: Number(item.planned_quantity),
      plannedUnitPrice: Number(item.planned_unit_price),
      plannedTotal: Number(item.planned_total),
      realQuantity: Number(item.real_quantity),
      realUnitPrice: Number(item.real_unit_price),
      realTotal: Number(item.real_total),
      status: item.status,
    })),
  };
}

// Lo estimado contra lo real de una categoría en el mes 'YYYY-MM'.
export async function getCategoryComparison({ categoryId, period, signal } = {}) {
  const query = new URLSearchParams({ period });
  const raw = await api.get(`${ENDPOINTS.CATEGORIES}/${categoryId}/comparison?${query}`, {
    signal,
  });
  return normalizeComparison(raw);
}
