import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import HomePage from './HomePage';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import type { Category } from '@/types/category.types';
import type { Todo } from '@/types/todo.types';

const mock = new MockAdapter(apiClient);

const cats: Category[] = [
  {
    categoryId: 'c1',
    userId: null,
    name: '개인',
    colorCode: '#4A90D9',
    isDefault: true,
    createdAt: '2026',
  },
];

function makeTodo(over: Partial<Todo>): Todo {
  return {
    todoId: 't1',
    userId: 'u1',
    categoryId: 'c1',
    title: '기본',
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
  mock.reset();
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth('jwt', {
    userId: 'u1',
    email: 'a@b.com',
    name: 'A',
    language: 'ko',
    createdAt: '2026',
  });
  mock.onGet('/categories').reply(200, { categories: cats });
});

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomePage (캘린더 뷰)', () => {
  test('현재 연·월이 헤더에 YYYY.MM 형식으로 표시', async () => {
    mock.onGet('/todos').reply(200, { todos: [] });
    renderPage();
    const now = new Date();
    const ym = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(await screen.findByText(ym)).toBeInTheDocument();
  });

  test('이전/다음 버튼으로 월 이동', async () => {
    mock.onGet('/todos').reply(200, { todos: [] });
    renderPage();
    const now = new Date();
    const ym = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
    await screen.findByText(ym);

    fireEvent.click(screen.getByRole('button', { name: '다음 달' }));
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextYm = `${next.getFullYear()}.${String(next.getMonth() + 1).padStart(2, '0')}`;
    expect(await screen.findByText(nextYm)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '오늘' }));
    expect(await screen.findByText(ym)).toBeInTheDocument();
  });

  test('할일 dueDate가 현재 달에 있으면 캘린더 셀에 제목 표시', async () => {
    const now = new Date();
    const target = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
    mock.onGet('/todos').reply(200, {
      todos: [makeTodo({ title: '캘린더 테스트 할일', dueDate: target })],
    });
    renderPage();
    expect(await screen.findByText('캘린더 테스트 할일')).toBeInTheDocument();
  });

  test('"+ 새 할일" 버튼 → 빈 폼 모달', async () => {
    mock.onGet('/todos').reply(200, { todos: [] });
    renderPage();
    await screen.findByRole('grid');
    fireEvent.click(screen.getByRole('button', { name: '+ 새 할일' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: '할일 추가' })).toBeInTheDocument();
    expect((within(dialog).getByLabelText('제목') as HTMLInputElement).value).toBe('');
  });

  test('캘린더 셀 클릭 → 해당 일자가 종료예정일에 채워진 폼', async () => {
    const now = new Date();
    const target = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-20`;
    mock.onGet('/todos').reply(200, { todos: [] });
    renderPage();
    await screen.findByRole('grid');
    fireEvent.click(screen.getByRole('gridcell', { name: target }));
    const dialog = await screen.findByRole('dialog');
    expect((within(dialog).getByLabelText('종료예정일') as HTMLInputElement).value).toBe(target);
  });

  test('캘린더 할일 클릭 → 수정 모달', async () => {
    const now = new Date();
    const target = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`;
    mock.onGet('/todos').reply(200, {
      todos: [makeTodo({ title: '편집할 일', dueDate: target })],
    });
    renderPage();
    fireEvent.click(await screen.findByText('편집할 일'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: '할일 수정' })).toBeInTheDocument();
    expect((within(dialog).getByLabelText('제목') as HTMLInputElement).value).toBe('편집할 일');
  });

  test('GET /todos 에러 → ErrorMessage', async () => {
    mock.onGet('/todos').reply(500, { error: { code: 'X', message: '서버 오류' } });
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('서버 오류'));
  });

  test('완료된 할일은 캘린더에서 done 스타일', async () => {
    const now = new Date();
    const target = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-12`;
    mock.onGet('/todos').reply(200, {
      todos: [makeTodo({ title: '완료한 일', dueDate: target, isCompleted: true })],
    });
    renderPage();
    const el = await screen.findByText('완료한 일');
    expect(el.className).toMatch(/--done/);
  });
});
