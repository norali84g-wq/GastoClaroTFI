import { useCallback } from 'react';
import { createExpense, deleteExpense, listExpenses, updateExpense } from '../api/expenses';
import { periodOf } from '../utils/dates';
import { useRemoteData } from './useRemoteData';

// Inserta el gasto respetando el orden de la API: del más reciente al más antiguo. Entre gastos del
// mismo día va primero, porque es el último que se cargó.
function insertByDate(expenses, expense) {
  const index = expenses.findIndex(({ date }) => date <= expense.date);
  return index === -1 ? [...expenses, expense] : expenses.toSpliced(index, 0, expense);
}

// Gastos del período 'YYYY-MM'.
// - create(newExpense) da de alta un gasto y lo devuelve, sin sumarlo al listado.
// - add(expense) suma al listado un gasto ya creado, sin volver a pedirlo. Solo si es del período
//   que está cargado y todavía no figura (pudo llegar en un pedido posterior al alta).
// - update(id, changes) y remove(id) hacen el pedido y, si sale bien, cambian el listado ya
//   cargado sin volver a pedirlo. Si al editarlo el gasto pasó a otro mes, sale del listado. Si el
//   pedido falla, el listado no cambia y el error llega a quien llamó.
export function useExpenses(period) {
  // El dato guarda a qué período corresponde, para que add() no sume un gasto al listado de otro
  // mes aunque el filtro haya cambiado entre el alta y la llamada.
  const load = useCallback(
    async ({ signal }) => ({ period, expenses: await listExpenses({ period, signal }) }),
    [period],
  );
  const { data, isLoading, error, retry, setData } = useRemoteData(load);

  const add = useCallback(
    (expense) =>
      setData((current) => {
        if (current?.period !== periodOf(expense.date)) return current;
        if (current.expenses.some(({ id }) => id === expense.id)) return current;
        return { ...current, expenses: insertByDate(current.expenses, expense) };
      }),
    [setData],
  );

  const update = useCallback(
    async (id, changes) => {
      const expense = await updateExpense(id, changes);
      setData((current) => {
        if (!current) return current;
        const others = current.expenses.filter((item) => item.id !== id);
        if (current.period !== periodOf(expense.date)) return { ...current, expenses: others };
        // Si cambió la fecha, el gasto tiene que quedar en su lugar del orden.
        const sameDate = current.expenses.find((item) => item.id === id)?.date === expense.date;
        return {
          ...current,
          expenses: sameDate
            ? current.expenses.map((item) => (item.id === id ? expense : item))
            : insertByDate(others, expense),
        };
      });
      return expense;
    },
    [setData],
  );

  const remove = useCallback(
    async (id) => {
      await deleteExpense(id);
      setData((current) =>
        current
          ? { ...current, expenses: current.expenses.filter((item) => item.id !== id) }
          : current,
      );
    },
    [setData],
  );

  return {
    expenses: data?.expenses,
    isLoading,
    error,
    retry,
    create: createExpense,
    add,
    update,
    remove,
  };
}
