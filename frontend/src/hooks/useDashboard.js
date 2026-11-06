import { getDashboard } from '../api/dashboard';
import { useRemoteData } from './useRemoteData';

export function useDashboard() {
  const { data, isLoading, error, retry } = useRemoteData(getDashboard);
  return { summary: data, isLoading, error, retry };
}
