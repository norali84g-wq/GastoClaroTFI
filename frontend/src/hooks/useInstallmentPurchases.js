import { useCallback } from 'react';
import {
  createInstallmentPurchase,
  deleteInstallmentPurchase,
  listInstallmentPurchases,
  updateInstallmentPurchase,
} from '../api/installmentPurchases';
import { useRemoteData } from './useRemoteData';

// Compras en cuotas del usuario. create, update y remove hacen el pedido y, si sale bien, cambian el
// listado ya cargado sin volver a pedirlo: la API devuelve la compra con las cuotas calculadas. Si
// el pedido falla, el listado no cambia y el error llega a quien llamó.
export function useInstallmentPurchases() {
  const { data, isLoading, error, retry, setData } = useRemoteData(listInstallmentPurchases);

  // Si el listado no llegó a cargarse, no hay nada que cambiar.
  const change = useCallback(
    (update) => setData((current) => (current ? update(current) : current)),
    [setData],
  );

  // La API las lista de la más reciente a la más antigua: la nueva va primero.
  const create = useCallback(
    async (newPurchase) => {
      const purchase = await createInstallmentPurchase(newPurchase);
      change((purchases) => [purchase, ...purchases.filter(({ id }) => id !== purchase.id)]);
      return purchase;
    },
    [change],
  );

  const update = useCallback(
    async (id, changes) => {
      const purchase = await updateInstallmentPurchase(id, changes);
      change((purchases) => purchases.map((item) => (item.id === id ? purchase : item)));
      return purchase;
    },
    [change],
  );

  const remove = useCallback(
    async (id) => {
      await deleteInstallmentPurchase(id);
      change((purchases) => purchases.filter((item) => item.id !== id));
    },
    [change],
  );

  return { purchases: data, isLoading, error, retry, create, update, remove };
}
