import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TodoForm from './TodoForm';
import type { Category } from '@/types/category.types';
import type { Todo } from '@/types/todo.types';

const cats: Category[] = [
  {
    categoryId: 'c1',
    userId: null,
    name: '개인',
    colorCode: '#4A90D9',
    isDefault: true,
    createdAt: '2026',
  },
  {
    categoryId: 'c2',
    userId: 'u1',
    name: '운동',
    colorCode: '#2ECC71',
    isDefault: false,
    createdAt: '2026',
  },
];

function todo(over: Partial<Todo> = {}): Todo {
  return {
    todoId: 't1',
    userId: 'u1',
    categoryId: 'c2',
    title: '스쿼트',
    description: '50개',
    dueDate: '2026-06-01',
    isCompleted: false,
    completedAt: null,
    createdAt: '2026',
    updatedAt: '2026',
    ...over,
  };
}

let onSubmit: ReturnType<typeof vi.fn>;
let onClose: ReturnType<typeof vi.fn>;

beforeEach(() => {
  onSubmit = vi.fn();
  onClose = vi.fn();
});

describe('TodoForm', () => {
  test('등록 모드: 빈 폼, 기본 카테고리 첫 항목 선택', () => {
    render(
      <TodoForm
        isOpen
        onClose={onClose}
        categories={cats}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect((within(dialog).getByLabelText('제목') as HTMLInputElement).value).toBe('');
    expect((within(dialog).getByLabelText('카테고리') as HTMLSelectElement).value).toBe('c1');
    expect(within(dialog).getByRole('button', { name: '등록' })).toBeInTheDocument();
  });

  test('수정 모드: 기존 데이터 채워짐', () => {
    render(
      <TodoForm
        isOpen
        onClose={onClose}
        categories={cats}
        initial={todo()}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect((within(dialog).getByLabelText('제목') as HTMLInputElement).value).toBe('스쿼트');
    expect((within(dialog).getByLabelText('설명') as HTMLTextAreaElement).value).toBe('50개');
    expect((within(dialog).getByLabelText('종료예정일') as HTMLInputElement).value).toBe(
      '2026-06-01',
    );
    expect((within(dialog).getByLabelText('카테고리') as HTMLSelectElement).value).toBe('c2');
    expect(within(dialog).getByRole('button', { name: '수정' })).toBeInTheDocument();
  });

  test('제목 비어있으면 검증 에러 + onSubmit 미호출', () => {
    render(
      <TodoForm
        isOpen
        onClose={onClose}
        categories={cats}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(screen.getByText('제목을 입력해 주세요')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('제목 201자 이상 → 검증 에러', () => {
    render(
      <TodoForm
        isOpen
        onClose={onClose}
        categories={cats}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: 'a'.repeat(201) } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(screen.getByText('제목은 200자 이하여야 합니다')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('카테고리 미선택 → 검증 에러', () => {
    render(
      <TodoForm
        isOpen
        onClose={onClose}
        categories={[]}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '독서' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(screen.getByText('카테고리를 선택해 주세요')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('정상 입력 → onSubmit 페이로드 전달 (빈 설명/날짜 null)', () => {
    render(
      <TodoForm
        isOpen
        onClose={onClose}
        categories={cats}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '독서' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(onSubmit).toHaveBeenCalledWith({
      title: '독서',
      categoryId: 'c1',
      description: null,
      dueDate: null,
    });
  });

  test('isSubmitting → 버튼 로딩 + 비활성화', () => {
    render(
      <TodoForm isOpen onClose={onClose} categories={cats} onSubmit={onSubmit} isSubmitting />,
    );
    const submit = screen.getByRole('button', { name: /등록/ });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
  });

  test('error 전달 → ErrorMessage 표시', () => {
    render(
      <TodoForm
        isOpen
        onClose={onClose}
        categories={cats}
        onSubmit={onSubmit}
        isSubmitting={false}
        error={new Error('서버 오류')}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('서버 오류');
  });

  test('취소 버튼 → onClose 호출', () => {
    render(
      <TodoForm
        isOpen
        onClose={onClose}
        categories={cats}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('isOpen=false → 렌더되지 않음', () => {
    render(
      <TodoForm
        isOpen={false}
        onClose={onClose}
        categories={cats}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
