import type { TodoFilters } from '@/types/todo.types';

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: TodoFilters = {}) => [...todoKeys.lists(), filters] as const,
  detail: (todoId: string) => [...todoKeys.all, 'detail', todoId] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
};
