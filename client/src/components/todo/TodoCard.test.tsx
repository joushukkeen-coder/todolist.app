import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TodoCard from './TodoCard';
import type { Todo } from '@/types/todo.types';
import type { Category } from '@/types/category.types';

const cat: Category = {
  categoryId: 'c1',
  userId: null,
  name: '개인',
  colorCode: '#4A90D9',
  isDefault: true,
  createdAt: '2026',
};
const baseTodo: Todo = {
  todoId: 't1',
  userId: 'u1',
  categoryId: 'c1',
  title: '청소',
  description: null,
  dueDate: '2026-06-01',
  isCompleted: false,
  completedAt: null,
  createdAt: '2026',
  updatedAt: '2026',
};

describe('TodoCard', () => {
  test('미완료 카드: aria-label "완료 처리", 취소선 없음', () => {
    render(<TodoCard todo={baseTodo} category={cat} onToggle={() => {}} />);
    expect(screen.getByLabelText('완료 처리')).toBeInTheDocument();
    const card = screen.getByText('청소').closest('article')!;
    expect(card.className).not.toMatch(/todo-card--done/);
  });

  test('완료 카드: aria-label "완료 취소", done 클래스', () => {
    render(
      <TodoCard todo={{ ...baseTodo, isCompleted: true }} category={cat} onToggle={() => {}} />,
    );
    expect(screen.getByLabelText('완료 취소')).toBeInTheDocument();
    expect(screen.getByText('청소').closest('article')!.className).toMatch(/todo-card--done/);
  });

  test('체크박스 클릭 → onToggle(todo) 호출', () => {
    const onToggle = vi.fn();
    render(<TodoCard todo={baseTodo} onToggle={onToggle} />);
    fireEvent.click(screen.getByLabelText('완료 처리'));
    expect(onToggle).toHaveBeenCalledWith(baseTodo);
  });

  test('수정·삭제 콜백 미전달 시 버튼 미렌더', () => {
    render(<TodoCard todo={baseTodo} onToggle={() => {}} />);
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull();
  });

  test('수정 버튼 클릭 → onEdit(todo) 호출', () => {
    const onEdit = vi.fn();
    render(<TodoCard todo={baseTodo} onToggle={() => {}} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(onEdit).toHaveBeenCalledWith(baseTodo);
  });

  test('체크박스 영역 최소 44x44 (CSS class todo-card__check)', () => {
    render(<TodoCard todo={baseTodo} onToggle={() => {}} />);
    const wrapper = screen.getByLabelText('완료 처리').parentElement!;
    expect(wrapper.className).toMatch(/todo-card__check/);
  });

  test('종료예정일 표시', () => {
    render(<TodoCard todo={baseTodo} category={cat} onToggle={() => {}} />);
    expect(screen.getByText(/2026-06-01/)).toBeInTheDocument();
  });
});
