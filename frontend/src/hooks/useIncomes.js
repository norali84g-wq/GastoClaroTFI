import { useCallback } from 'react';
import { createIncome, deleteIncome, listIncomes, updateIncome } from '../api/incomes';
import { useRemoteData } from './useRemoteData';

// Inserta el ingreso respetando el orden de la API: del más reciente al más antiguo. Entre
// ingresos del mismo día va primero, porque es el último que se cargó.
function insertByDate(incomes, income) {
  const index = incomes.findIndex(({ date }) => date <= income.date);
  return index === -1 ? [...incomes, income] : incomes.toSpliced(index, 0, income);
}

// Ingresos del usuario.
// - create(newIncome) da de alta un ingreso y lo devuelve, sin sumarlo al listado.
// - add(income) suma al listado un ingreso ya creado, sin volver a pedirlo. Si ya figura (pudo
//   llegar en un pedido posterior al alta), no lo duplica.
// - update(id, changes) y remove(id) hacen el pedido y, si sale bien, cambian el listado ya cargado
//   sin volver a pedirlo. Si el pedido falla, el listado no cambia y el error llega a quien llamó.
export function useIncomes() {
  // listIncomes es una función de módulo, así que es estable: el dato se pide una sola vez.
  const { data, isLoading, error, retry, setData } = useRemoteData(listIncomes);

  // Si el listado no llegó a cargarse, no hay nada que cambiar.
  const change = useCallback(
    (apply) => setData((current) => (current ? apply(current) : current)),
    [setData],
  );

  const add = useCallback(
    (income) =>
      change((incomes) =>
        incomes.some(({ id }) => id === income.id) ? incomes : insertByDate(incomes, income),
      ),
    [change],
  );

  // La fecha pudo cambiar: el ingreso se vuelve a ubicar según su fecha.
  const update = useCallback(
    async (id, changes) => {
      const income = await updateIncome(id, changes);
      change((incomes) =>
        insertByDate(
          incomes.filter((item) => item.id !== id),
          income,
        ),
      );
      return income;
    },
    [change],
  );

  const remove = useCallback(
    async (id) => {
      await deleteIncome(id);
      change((incomes) => incomes.filter((item) => item.id !== id));
    },
    [change],
  );

  return { incomes: data, isLoading, error, retry, create: createIncome, add, update, remove };
}
