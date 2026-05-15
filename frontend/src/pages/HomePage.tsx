import { useState } from 'react';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import ErrorMessage from '@/components/common/ErrorMessage';
import TodoCalendar from '@/components/calendar/TodoCalendar';
import TodoForm from '@/components/todo/TodoForm';
import { useTodos } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTodo, useDeleteTodo, useUpdateTodo } from '@/hooks/useTodoMutations';
import { formatYearMonth, shiftMonth } from '@/utils/calendar';
import type { Todo, TodoCreateRequest, TodoUpdateRequest } from '@/types/todo.types';
import './HomePage.css';

export default function HomePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const todosQuery = useTodos({});
  const categoriesQuery = useCategories();
  const create = useCreateTodo();
  const updateMut = useUpdateTodo();
  const remove = useDeleteTodo();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [defaultDueDate, setDefaultDueDate] = useState<string | undefined>();
  const [deleting, setDeleting] = useState<Todo | null>(null);

  const goPrev = () => {
    const next = shiftMonth(year, month, -1);
    setYear(next.year);
    setMonth(next.month);
  };
  const goNext = () => {
    const next = shiftMonth(year, month, 1);
    setYear(next.year);
    setMonth(next.month);
  };
  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  };

  const openCreate = (isoDate?: string) => {
    setEditing(null);
    setDefaultDueDate(isoDate);
    setFormOpen(true);
  };
  const openEdit = (todo: Todo) => {
    setEditing(todo);
    setDefaultDueDate(undefined);
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

  const closeDelete = () => {
    setDeleting(null);
    remove.reset();
  };
  const handleDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.todoId, { onSuccess: () => closeDelete() });
  };

  const initialTodo: Todo | null = editing
    ? editing
    : defaultDueDate
      ? ({ dueDate: defaultDueDate } as Todo)
      : null;

  return (
    <section className="home-page">
      <header className="home-page__header">
        <div className="home-page__nav">
          <Button size="sm" variant="ghost" onClick={goPrev} aria-label="이전 달">
            ‹
          </Button>
          <h1 className="home-page__title">{formatYearMonth(year, month)}</h1>
          <Button size="sm" variant="ghost" onClick={goNext} aria-label="다음 달">
            ›
          </Button>
          <Button size="sm" variant="secondary" onClick={goToday}>
            오늘
          </Button>
        </div>
        <Button onClick={() => openCreate()}>+ 새 할일</Button>
      </header>

      {todosQuery.isLoading && <Spinner size="lg" />}
      {todosQuery.isError && <ErrorMessage error={todosQuery.error} />}
      {todosQuery.isSuccess && (
        <TodoCalendar
          year={year}
          month={month}
          todos={todosQuery.data}
          onCellClick={openCreate}
          onTodoClick={openEdit}
        />
      )}

      <TodoForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initial={initialTodo}
        categories={categoriesQuery.data ?? []}
        onSubmit={handleSubmit}
        isSubmitting={create.isPending || updateMut.isPending}
        error={editing ? updateMut.error : create.error}
      />

      <Modal isOpen={!!deleting} onClose={closeDelete} title="할일 삭제 확인">
        <p>"{deleting?.title}" 할일을 정말 삭제하시겠습니까?</p>
        {remove.isError && <ErrorMessage error={remove.error} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button variant="secondary" onClick={closeDelete}>
            취소
          </Button>
          <Button variant="danger" isLoading={remove.isPending} onClick={handleDelete}>
            삭제
          </Button>
        </div>
      </Modal>
    </section>
  );
}
