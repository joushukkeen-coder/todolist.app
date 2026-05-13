import { apiClient } from './apiClient';
import type {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
} from '@/types/category.types';

interface ListResponse {
  categories: Category[];
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<ListResponse>('/categories');
  return data.categories;
}

export async function createCategory(payload: CategoryCreateRequest): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', payload);
  return data;
}

export async function updateCategory(
  categoryId: string,
  payload: CategoryUpdateRequest,
): Promise<Category> {
  const { data } = await apiClient.patch<Category>(`/categories/${categoryId}`, payload);
  return data;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await apiClient.delete(`/categories/${categoryId}`);
}
