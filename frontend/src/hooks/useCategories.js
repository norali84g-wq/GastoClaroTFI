import { listCategories } from '../api/categories';
import { useRemoteData } from './useRemoteData';

export function useCategories() {
  const { data, isLoading, error, retry } = useRemoteData(listCategories);
  return { categories: data, isLoading, error, retry };
}
