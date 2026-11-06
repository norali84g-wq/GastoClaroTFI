import { useCallback } from 'react';
import {
  createSavingsGoal,
  deleteSavingsGoal,
  listSavingsGoals,
  updateSavingsGoal,
} from '../api/savingsGoals';
import { useRemoteData } from './useRemoteData';

// Metas de ahorro del usuario, de la más reciente a la más antigua.
// - create(goal), update(id, goal) y destroy(id) hablan con la API y no tocan el listado.
// - add(goal), replace(goal) y discard(id) acomodan el listado ya cargado, sin volver a pedirlo.
export function useSavingsGoals() {
  // listSavingsGoals es una función de módulo, así que es estable: el dato se pide una sola vez.
  const { data, isLoading, error, retry, setData } = useRemoteData(listSavingsGoals);

  // La meta nueva va primera, como en la API. Si ya figura, no se duplica.
  const add = useCallback(
    (goal) =>
      setData((current) => {
        if (!current) return current;
        if (current.some(({ id }) => id === goal.id)) return current;
        return [goal, ...current];
      }),
    [setData],
  );

  const replace = useCallback(
    (goal) => setData((current) => current?.map((item) => (item.id === goal.id ? goal : item))),
    [setData],
  );

  const discard = useCallback(
    (id) => setData((current) => current?.filter((item) => item.id !== id)),
    [setData],
  );

  return {
    goals: data,
    isLoading,
    error,
    retry,
    create: createSavingsGoal,
    update: updateSavingsGoal,
    destroy: deleteSavingsGoal,
    add,
    replace,
    discard,
  };
}
