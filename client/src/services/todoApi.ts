import { apiClient } from './apiClient';
import type { Todo, TodoCreateRequest, TodoFilters, TodoUpdateRequest } from '@/types/todo.types';

interface ListResponse {
  todos: Todo[];
}

function toQuery(filters: TodoFilters): Record<string, string> {
  const q: Record<string, string> = {};
  if (filters.categoryId) q.categoryId = filters.categoryId;
  if (filters.isCompleted !== undefined) q.isCompleted = String(filters.isCompleted);
  if (filters.dueDateFrom) q.dueDateFrom = filters.dueDateFrom;
  if (filters.dueDateTo) q.dueDateTo = filters.dueDateTo;
  return q;
}

export async function listTodos(filters: TodoFilters = {}): Promise<Todo[]> {
  const { data } = await apiClient.get<ListResponse>('/todos', { params: toQuery(filters) });
  return data.todos;
}

export async function createTodo(payload: TodoCreateRequest): Promise<Todo> {
  const { data } = await apiClient.post<Todo>('/todos', payload);
  return data;
}

export async function updateTodo(todoId: string, payload: TodoUpdateRequest): Promise<Todo> {
  const { data } = await apiClient.patch<Todo>(`/todos/${todoId}`, payload);
  return data;
}

export async function completeTodo(todoId: string): Promise<Todo> {
  const { data } = await apiClient.patch<Todo>(`/todos/${todoId}/complete`);
  return data;
}

export async function reopenTodo(todoId: string): Promise<Todo> {
  const { data } = await apiClient.patch<Todo>(`/todos/${todoId}/reopen`);
  return data;
}

export async function deleteTodo(todoId: string): Promise<void> {
  await apiClient.delete(`/todos/${todoId}`);
}
