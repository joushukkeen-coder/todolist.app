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
  {
    categoryId: 'c2',
    userId: 'u1',
    name: '운동',
    colorCode: '#2ECC71',
    isDefault: false,
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
    createdAt: '2026-05-13T00:00:00Z',
    updatedAt: '2026-05-13T00:00:00Z',
    ...over,
  };
}

beforeEach(() => {
  mock.reset();
  useAuthStore.getState().clearAuth();
  useAuthStore
    .getState()
    .setAuth('jwt', { userId: 'u1', email: 'a@b.com', name: 'A', createdAt: '2026' });
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

describe('HomePage', () => {
  test('정상 데이터 → 카드 + 카테고리 배지 렌더', async () => {
    mock.onGet('/todos').reply(200, { todos: [makeTodo({ title: '청소', categoryId: 'c1' })] });
    renderPage();
    expect(await screen.findByText('청소')).toBeInTheDocument();
    expect(screen.getAllByText('개인').length).toBeGreaterThan(0);
  });

  test('빈 데이터 → 안내 문구', async () => {
    mock.onGet('/todos').reply(200, { todos: [] });
    renderPage();
    expect(await screen.findByText('표시할 할일이 없습니다.')).toBeInTheDocument();
  });

  test('GET 에러 → ErrorMessage', async () => {
    mock.onGet('/todos').reply(500, { error: { code: 'X', message: '서버 오류' } });
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  test('필터 변경 → 새 쿼리 파라미터 반영', async () => {
    const paramsCalls: Record<string, string>[] = [];
    mock.onGet('/todos').reply((cfg) => {
      paramsCalls.push({ ...(cfg.params as Record<string, string>) });
      return [200, { todos: [] }];
    });
    renderPage();
    await screen.findByText('표시할 할일이 없습니다.');
    expect(paramsCalls[0]).toEqual({});

    fireEvent.click(await screen.findByLabelText('완료'));
    await waitFor(() => expect(paramsCalls.length).toBeGreaterThanOrEqual(2));
    expect(paramsCalls[paramsCalls.length - 1]?.isCompleted).toBe('true');
  });

  test('카테고리 필터 적용 → categoryId 쿼리 추가', async () => {
    const paramsCalls: Record<string, string>[] = [];
    mock.onGet('/todos').reply((cfg) => {
      paramsCalls.push({ ...(cfg.params as Record<string, string>) });
      return [200, { todos: [] }];
    });
    renderPage();
    await screen.findByText('표시할 할일이 없습니다.');
    const select = (await screen.findAllByRole('combobox'))[0]!;
    fireEvent.change(select, { target: { value: 'c2' } });
    await waitFor(() => expect(paramsCalls.some((p) => p.categoryId === 'c2')).toBe(true));
  });

  test('"+ 새 할일" 클릭 → 빈 폼 Modal, 제출 → POST 호출 + invalidate', async () => {
    let postBody: Record<string, unknown> | null = null;
    let getCount = 0;
    mock.onGet('/todos').reply(() => {
      getCount += 1;
      return [200, { todos: [] }];
    });
    mock.onPost('/todos').reply((cfg) => {
      postBody = JSON.parse(String(cfg.data));
      return [201, makeTodo({ title: postBody!.title as string })];
    });
    renderPage();
    await screen.findByText('표시할 할일이 없습니다.');
    const before = getCount;

    fireEvent.click(screen.getByRole('button', { name: '+ 새 할일' }));
    const dialog = await screen.findByRole('dialog');
    expect((within(dialog).getByLabelText('제목') as HTMLInputElement).value).toBe('');
    fireEvent.change(within(dialog).getByLabelText('제목'), { target: { value: '독서' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '등록' }));

    await waitFor(() => expect(postBody).toMatchObject({ title: '독서', categoryId: 'c1' }));
    await waitFor(() => expect(getCount).toBeGreaterThan(before));
  });

  test('카드 수정 버튼 → 데이터 채워진 Modal, PATCH 호출', async () => {
    mock
      .onGet('/todos')
      .reply(200, { todos: [makeTodo({ title: '청소', dueDate: '2026-06-01' })] });
    let patchBody: Record<string, unknown> | null = null;
    mock.onPatch('/todos/t1').reply((cfg) => {
      patchBody = JSON.parse(String(cfg.data));
      return [200, makeTodo({ title: patchBody!.title as string })];
    });
    renderPage();
    await screen.findByText('청소');
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    const dialog = await screen.findByRole('dialog');
    expect((within(dialog).getByLabelText('제목') as HTMLInputElement).value).toBe('청소');
    fireEvent.change(within(dialog).getByLabelText('제목'), { target: { value: '청소 완료' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '수정' }));
    await waitFor(() => expect(patchBody).toMatchObject({ title: '청소 완료' }));
  });

  test('POST 에러 → 폼 내 ErrorMessage 표시', async () => {
    mock.onGet('/todos').reply(200, { todos: [] });
    mock.onPost('/todos').reply(500, { error: { code: 'X', message: '서버 오류' } });
    renderPage();
    await screen.findByText('표시할 할일이 없습니다.');
    fireEvent.click(screen.getByRole('button', { name: '+ 새 할일' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('제목'), { target: { value: '독서' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '등록' }));
    await waitFor(() => expect(within(dialog).getByText('서버 오류')).toBeInTheDocument());
  });

  test('체크박스 클릭 → 미완료면 complete API 호출 + done 스타일', async () => {
    let serverDone = false;
    mock.onGet('/todos').reply(() => [
      200,
      {
        todos: [
          makeTodo({
            title: '청소',
            isCompleted: serverDone,
            completedAt: serverDone ? '2026-05-13' : null,
          }),
        ],
      },
    ]);
    let completeCalled = false;
    mock.onPatch('/todos/t1/complete').reply(() => {
      completeCalled = true;
      serverDone = true;
      return [200, makeTodo({ title: '청소', isCompleted: true, completedAt: '2026-05-13' })];
    });
    renderPage();
    const initial = (await screen.findByText('청소')).closest('article')!;
    expect(initial.className).not.toMatch(/todo-card--done/);
    fireEvent.click(within(initial).getByLabelText('완료 처리'));
    await waitFor(() => expect(completeCalled).toBe(true));
    await waitFor(() => {
      const next = screen.getByText('청소').closest('article')!;
      expect(next.className).toMatch(/todo-card--done/);
    });
  });

  test('완료 상태 체크박스 클릭 → reopen API 호출', async () => {
    mock
      .onGet('/todos')
      .reply(200, {
        todos: [makeTodo({ title: '청소', isCompleted: true, completedAt: '2026-05-13' })],
      });
    let reopenCalled = false;
    mock.onPatch('/todos/t1/reopen').reply(() => {
      reopenCalled = true;
      return [200, makeTodo({ title: '청소', isCompleted: false })];
    });
    renderPage();
    const card = (await screen.findByText('청소')).closest('article')!;
    expect(card.className).toMatch(/todo-card--done/);
    fireEvent.click(within(card).getByLabelText('완료 취소'));
    await waitFor(() => expect(reopenCalled).toBe(true));
  });

  test('complete API 에러 → 낙관적 업데이트 롤백 + ErrorMessage', async () => {
    mock.onGet('/todos').reply(200, { todos: [makeTodo({ title: '청소', isCompleted: false })] });
    mock.onPatch('/todos/t1/complete').reply(500, { error: { code: 'X', message: '토글 실패' } });
    renderPage();
    const card = (await screen.findByText('청소')).closest('article')!;
    fireEvent.click(within(card).getByLabelText('완료 처리'));
    await waitFor(() => expect(screen.getByText('토글 실패')).toBeInTheDocument());
    // 롤백: invalidate → 재조회 결과는 isCompleted: false 그대로
    await waitFor(() => {
      const c = screen.getByText('청소').closest('article')!;
      expect(c.className).not.toMatch(/todo-card--done/);
    });
  });

  test('카드 정렬: GET 응답 순서대로 렌더 (created_at DESC는 백엔드 보장)', async () => {
    mock.onGet('/todos').reply(200, {
      todos: [
        makeTodo({ todoId: 't2', title: '나중', createdAt: '2026-05-14' }),
        makeTodo({ todoId: 't1', title: '먼저', createdAt: '2026-05-13' }),
      ],
    });
    renderPage();
    await screen.findByText('나중');
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(['나중', '먼저']);
  });
});
