import { useCallback } from 'react';
import {
  createCategory,
  deleteCategory,
  listCategoryDetails,
  updateCategory,
} from '../api/categories';
import { useRemoteData } from './useRemoteData';

// Por nombre, como las lista la API.
function byName(a, b) {
  return a.name.localeCompare(b.name);
}

// Categorías para administrarlas. create y update hacen el pedido y, si sale bien, cambian el
// listado ya cargado sin volver a pedirlo. Si el pedido falla, el error llega a quien llamó.
export function useCategoryManager() {
  const { data, isLoading, error, retry, setData } = useRemoteData(listCategoryDetails);

  const change = useCallback(
    (update) => setData((current) => (current ? update(current) : current)),
    [setData],
  );

  const create = useCallback(
    async (newCategory) => {
      const category = await createCategory(newCategory);
      change((categories) =>
        [...categories.filter(({ id }) => id !== category.id), category].toSorted(byName),
      );
      return category;
    },
    [change],
  );

  const update = useCallback(
    async (id, changes) => {
      const category = await updateCategory(id, changes);
      change((categories) =>
        categories.map((item) => (item.id === id ? category : item)).toSorted(byName),
      );
      return category;
    },
    [change],
  );

  // Si la API la borra, sale del listado; si no (tiene gastos, por ejemplo), el error llega a quien
  // llamó y el listado no cambia.
  const remove = useCallback(
    async (id) => {
      await deleteCategory(id);
      change((categories) => categories.filter((item) => item.id !== id));
    },
    [change],
  );

  return { categories: data, isLoading, error, retry, create, update, remove };
}
