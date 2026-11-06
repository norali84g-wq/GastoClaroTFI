import { useCallback } from 'react';
import {
  createShoppingListItem,
  deleteShoppingListItem,
  listShoppingListItems,
  updateShoppingListItem,
} from '../api/shoppingListItems';
import { useRemoteData } from './useRemoteData';

// Como los lista la API: por mes y, dentro del mes, por nombre.
function byPeriodAndName(a, b) {
  return a.period.localeCompare(b.period) || a.name.localeCompare(b.name);
}

// Ítems de la lista de gastos fijos. create, update y remove hacen el pedido y, si sale bien,
// cambian el listado ya cargado sin volver a pedirlo. Si el pedido falla, el listado no cambia y el
// error llega a quien llamó.
export function useShoppingListItems() {
  const { data, isLoading, error, retry, setData } = useRemoteData(listShoppingListItems);

  // Si el listado no llegó a cargarse, no hay nada que cambiar.
  const change = useCallback(
    (update) => setData((current) => (current ? update(current) : current)),
    [setData],
  );

  const create = useCallback(
    async (newItem) => {
      const item = await createShoppingListItem(newItem);
      change((items) =>
        [...items.filter(({ id }) => id !== item.id), item].toSorted(byPeriodAndName),
      );
      return item;
    },
    [change],
  );

  const update = useCallback(
    async (id, changes) => {
      const item = await updateShoppingListItem(id, changes);
      change((items) =>
        items.map((current) => (current.id === id ? item : current)).toSorted(byPeriodAndName),
      );
      return item;
    },
    [change],
  );

  const remove = useCallback(
    async (id) => {
      await deleteShoppingListItem(id);
      change((items) => items.filter((item) => item.id !== id));
    },
    [change],
  );

  return { items: data, isLoading, error, retry, create, update, remove };
}
