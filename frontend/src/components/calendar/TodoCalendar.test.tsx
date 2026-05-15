import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TodoCalendar from './TodoCalendar';
import { useAuthStore } from '@/store/authStore';
import type { Todo } from '@/types/todo.types';

function makeTodo(over: Partial<Todo>): Todo {
  return {
    todoId: 't1',
    userId: 'u1',
    categoryId: 'c1',
    title: 'T',
    description: null,
    dueDate: null,
    isCompleted: false,
    completedAt: null,
    createdAt: '2026',
    updatedAt: '2026',
    ...over,
  };
}

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth('jwt', {
    userId: 'u1',
    email: 'a@b.com',
    name: 'A',
    language: 'ko',
    createdAt: '2026',
  });
});

describe('TodoCalendar', () => {
  test('한국어 요일 헤더 7개 (일~토)', () => {
    render(<TodoCalendar year={2026} month={4} todos={[]} />);
    ['일', '월', '화', '수', '목', '금', '토'].forEach((w) =>
      expect(screen.getByText(w)).toBeInTheDocument(),
    );
  });

  test('42개 그리드 셀 렌더', () => {
    render(<TodoCalendar year={2026} month={4} todos={[]} />);
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
  });

  test('dueDate=YYYY-MM-DD인 할일 제목이 해당 셀에 표시', () => {
    const todos = [
      makeTodo({ todoId: 't1', title: '스쿼트', dueDate: '2026-05-15' }),
      makeTodo({ todoId: 't2', title: '회의', dueDate: '2026-05-20' }),
    ];
    render(<TodoCalendar year={2026} month={4} todos={todos} />);
    expect(screen.getByText('스쿼트')).toBeInTheDocument();
    expect(screen.getByText('회의')).toBeInTheDocument();
  });

  test('dueDate가 ISO 타임스탬프여도 날짜 부분으로 매칭', () => {
    const todos = [makeTodo({ title: '청소', dueDate: '2026-05-15T15:00:00.000Z' })];
    render(<TodoCalendar year={2026} month={4} todos={todos} />);
    expect(screen.getByText('청소')).toBeInTheDocument();
  });

  test('완료된 할일은 done 스타일', () => {
    const todos = [makeTodo({ title: '완료된 일', dueDate: '2026-05-15', isCompleted: true })];
    render(<TodoCalendar year={2026} month={4} todos={todos} />);
    expect(screen.getByText('완료된 일').className).toMatch(/--done/);
  });

  test('4건 이상이면 "+N" 표기', () => {
    const todos = Array.from({ length: 5 }, (_, i) =>
      makeTodo({ todoId: `t${i}`, title: `할일${i}`, dueDate: '2026-05-15' }),
    );
    render(<TodoCalendar year={2026} month={4} todos={todos} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  test('할일 클릭 → onTodoClick 호출, 셀 클릭 → onCellClick', () => {
    const onTodo = vi.fn();
    const onCell = vi.fn();
    const todos = [makeTodo({ title: '스쿼트', dueDate: '2026-05-15' })];
    render(
      <TodoCalendar
        year={2026}
        month={4}
        todos={todos}
        onTodoClick={onTodo}
        onCellClick={onCell}
      />,
    );
    fireEvent.click(screen.getByText('스쿼트'));
    expect(onTodo).toHaveBeenCalledWith(expect.objectContaining({ title: '스쿼트' }));

    // 빈 셀(2026-05-20) 클릭
    fireEvent.click(screen.getByRole('gridcell', { name: '2026-05-20' }));
    expect(onCell).toHaveBeenCalledWith('2026-05-20');
  });

  test('영어 사용자 → Sun/Mon/... 헤더', () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      language: 'en',
      createdAt: '2026',
    });
    render(<TodoCalendar year={2026} month={4} todos={[]} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });
});
