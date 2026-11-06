import { useCallback } from 'react';
import { getCategoryComparison } from '../api/categoryComparison';
import { useRemoteData } from './useRemoteData';

// Lo estimado contra lo real de una categoría en un mes. Vuelve a pedir si cambia la categoría o el
// mes.
export function useCategoryComparison(categoryId, period) {
  const load = useCallback(
    ({ signal }) => getCategoryComparison({ categoryId, period, signal }),
    [categoryId, period],
  );
  const { data, isLoading, error, retry } = useRemoteData(load);
  return { comparison: data, isLoading, error, retry };
}
