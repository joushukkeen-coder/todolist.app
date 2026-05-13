import { useState } from 'react';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import TodoFilterPanel from '@/components/todo/TodoFilterPanel';
import TodoCard from '@/components/todo/TodoCard';
import TodoForm from '@/components/todo/TodoForm';
import { useTodoFilters, useTodos } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import {
  useCompleteTodo,
  useCreateTodo,
  useReopenTodo,
  useUpdateTodo,
} from '@/hooks/useTodoMutations';
import type { Todo, TodoCreateRequest, TodoUpdateRequest } from '@/types/todo.types';
import './HomePage.css';

export default function HomePage() {
  const { filters, update, reset } = useTodoFilters();
  const todosQuery = useTodos(filters);
  const categoriesQuery = useCategories();
  const create = useCreateTodo();
  const updateMut = useUpdateTodo();
  const complete = useCompleteTodo();
  const reopen = useReopenTodo();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (todo: Todo) => {
    setEditing(todo);
    setFormOpen(true);
  };

  const handleSubmit = (payload: TodoCreateRequest | TodoUpdateRequest) => {
    if (editing) {
      updateMut.mutate(
        { todoId: editing.todoId, payload: payload as TodoUpdateRequest },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      create.mutate(payload as TodoCreateRequest, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleToggle = (t: Todo) => {
    if (t.isCompleted) reopen.mutate(t.todoId);
    else complete.mutate(t.todoId);
  };

  const toggleError = complete.error ?? reopen.error;

  return (
    <section className="home-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>할일 목록</h1>
        <Button onClick={openCreate}>+ 새 할일</Button>
      </header>
      <div className="home-page__layout">
        <TodoFilterPanel
          categories={categoriesQuery.data ?? []}
          filters={filters}
          onChange={update}
          onReset={reset}
        />
        <div className="home-page__list">
          {toggleError ? <ErrorMessage error={toggleError as Error} /> : null}
          {todosQuery.isLoading && <Spinner size="lg" />}
          {todosQuery.isError && <ErrorMessage error={todosQuery.error} />}
          {todosQuery.isSuccess && todosQuery.data.length === 0 && (
            <p style={{ color: '#868e96' }}>표시할 할일이 없습니다.</p>
          )}
          {todosQuery.isSuccess &&
            todosQuery.data.map((t) => (
              <TodoCard
                key={t.todoId}
                todo={t}
                category={categoriesQuery.data?.find((c) => c.categoryId === t.categoryId)}
                onToggle={handleToggle}
                onEdit={openEdit}
              />
            ))}
        </div>
      </div>

      <TodoForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        categories={categoriesQuery.data ?? []}
        onSubmit={handleSubmit}
        isSubmitting={create.isPending || updateMut.isPending}
        error={editing ? updateMut.error : create.error}
      />
    </section>
  );
}
