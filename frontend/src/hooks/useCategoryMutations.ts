import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, deleteCategory, updateCategory } from '@/services/categoryApi';
import { categoryKeys } from '@/query-keys';
import type { CategoryCreateRequest, CategoryUpdateRequest } from '@/types/category.types';

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryCreateRequest) => createCategory(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: CategoryUpdateRequest }) =>
      updateCategory(categoryId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
