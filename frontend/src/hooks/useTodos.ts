import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listTodos } from '@/services/todoApi';
import { todoKeys } from '@/query-keys';
import type { TodoFilters } from '@/types/todo.types';

export function useTodos(filters: TodoFilters) {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: () => listTodos(filters),
  });
}

export function useTodoFilters() {
  const [filters, setFilters] = useState<TodoFilters>({});
  const update = (patch: Partial<TodoFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      (Object.keys(next) as (keyof TodoFilters)[]).forEach((k) => {
        if (next[k] === undefined || next[k] === '') delete next[k];
      });
      return next;
    });
  };
  const reset = () => setFilters({});
  return { filters, update, reset };
}
