import { useCallback } from 'react';
import { getStatistics } from '../api/statistics';
import { useRemoteData } from './useRemoteData';

// Estadísticas de un año y, opcionalmente, de un mes (número del 1 al 12). Vuelve a pedir si cambian.
export function useStatistics(year, month) {
  const load = useCallback(({ signal }) => getStatistics({ year, month, signal }), [year, month]);
  const { data, isLoading, error, retry } = useRemoteData(load);
  return { statistics: data, isLoading, error, retry };
}
