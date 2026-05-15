import { useQuery } from '@tanstack/react-query';
import { listCategories } from '@/services/categoryApi';
import { categoryKeys } from '@/query-keys';

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: listCategories,
  });
}
