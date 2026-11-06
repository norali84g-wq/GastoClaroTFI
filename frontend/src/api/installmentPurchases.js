import { api } from './client';

const ENDPOINTS = {
  INSTALLMENT_PURCHASES: '/installment_purchases',
};

// Hacia adentro de la app una compra en cuotas es { id, description, totalAmount, installmentsCount,
// firstPeriod, categoryId, installmentAmount, remainingInstallments }. Los montos llegan como texto
// ("1200.0") y acá pasan a número. installmentAmount y remainingInstallments los calcula la API
// (las cuotas que faltan, hasta el mes en curso). vendor_id quedó fuera del TP2: no se pasa.
function normalizeInstallmentPurchase(raw) {
  return {
    id: raw.id,
    description: raw.description,
    totalAmount: Number(raw.total_amount),
    installmentsCount: raw.installments_count,
    firstPeriod: raw.first_period,
    categoryId: raw.category_id,
    installmentAmount: Number(raw.installment_amount),
    remainingInstallments: raw.remaining_installments,
  };
}

// Recibe la compra con los tipos de la app (montos e ids como números, firstPeriod 'YYYY-MM'). La
// descripción viaja sin espacios en los extremos.
function toApiBody({ description, totalAmount, installmentsCount, firstPeriod, categoryId }) {
  return {
    description: description.trim(),
    total_amount: totalAmount,
    installments_count: installmentsCount,
    first_period: firstPeriod,
    category_id: categoryId,
  };
}

// Compras en cuotas del grupo familiar del usuario del token, de la más reciente a la más antigua.
// No crean consumo: no cambian el resumen del panel.
export async function listInstallmentPurchases({ signal } = {}) {
  const purchases = await api.get(ENDPOINTS.INSTALLMENT_PURCHASES, { signal });
  return purchases.map(normalizeInstallmentPurchase);
}

// Devuelve la compra creada, con el valor de la cuota y las cuotas restantes ya calculados.
export async function createInstallmentPurchase(purchase) {
  return normalizeInstallmentPurchase(
    await api.post(ENDPOINTS.INSTALLMENT_PURCHASES, toApiBody(purchase)),
  );
}

// Manda todos los campos del formulario. Devuelve la compra con las cuotas recalculadas.
export async function updateInstallmentPurchase(id, purchase) {
  return normalizeInstallmentPurchase(
    await api.patch(`${ENDPOINTS.INSTALLMENT_PURCHASES}/${id}`, toApiBody(purchase)),
  );
}

export async function deleteInstallmentPurchase(id) {
  await api.delete(`${ENDPOINTS.INSTALLMENT_PURCHASES}/${id}`);
}
