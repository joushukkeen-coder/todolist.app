import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { completeTodo, createTodo, reopenTodo, updateTodo } from '@/services/todoApi';
import { todoKeys } from '@/query-keys';
import type { Todo, TodoCreateRequest, TodoUpdateRequest } from '@/types/todo.types';

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TodoCreateRequest) => createTodo(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.lists() }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, payload }: { todoId: string; payload: TodoUpdateRequest }) =>
      updateTodo(todoId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.lists() }),
  });
}

interface ToggleContext {
  snapshots: Array<[QueryKey, Todo[] | undefined]>;
}

function buildToggleHandlers(qc: ReturnType<typeof useQueryClient>, nextCompleted: boolean) {
  return {
    onMutate: async (todoId: string): Promise<ToggleContext> => {
      await qc.cancelQueries({ queryKey: todoKeys.lists() });
      const snapshots = qc.getQueriesData<Todo[]>({ queryKey: todoKeys.lists() });
      qc.setQueriesData<Todo[]>({ queryKey: todoKeys.lists() }, (old) =>
        old?.map((t) =>
          t.todoId === todoId
            ? {
                ...t,
                isCompleted: nextCompleted,
                completedAt: nextCompleted ? new Date().toISOString() : null,
              }
            : t,
        ),
      );
      return { snapshots };
    },
    onError: (_err: unknown, _vars: string, ctx: ToggleContext | undefined) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: todoKeys.lists() }),
  };
}

export function useCompleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (todoId: string) => completeTodo(todoId),
    ...buildToggleHandlers(qc, true),
  });
}

export function useReopenTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (todoId: string) => reopenTodo(todoId),
    ...buildToggleHandlers(qc, false),
  });
}
