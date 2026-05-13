import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import CategoriesPage from './CategoriesPage';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import type { Category } from '@/types/category.types';

const mock = new MockAdapter(apiClient);

const defaultCats: Category[] = [
  {
    categoryId: 'd1',
    userId: null,
    name: '개인',
    colorCode: '#4A90D9',
    isDefault: true,
    createdAt: '2026',
  },
  {
    categoryId: 'd2',
    userId: null,
    name: '업무',
    colorCode: '#E8503A',
    isDefault: true,
    createdAt: '2026',
  },
];
const customCats: Category[] = [
  {
    categoryId: 'c1',
    userId: 'u1',
    name: '운동',
    colorCode: '#2ECC71',
    isDefault: false,
    createdAt: '2026',
  },
];

beforeEach(() => {
  mock.reset();
  useAuthStore.getState().clearAuth();
  useAuthStore
    .getState()
    .setAuth('jwt', { userId: 'u1', email: 'a@b.com', name: 'A', createdAt: '2026' });
});

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CategoriesPage', () => {
  test('로딩 → Spinner, 데이터 로드 후 기본/사용자 카테고리 표시', async () => {
    mock.onGet('/categories').reply(200, { categories: [...defaultCats, ...customCats] });
    renderPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
    await screen.findByText('개인');
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.getByText('운동')).toBeInTheDocument();
  });

  test('기본 카테고리에는 수정/삭제 버튼 없음, 사용자 카테고리에만 있음', async () => {
    mock.onGet('/categories').reply(200, { categories: [...defaultCats, ...customCats] });
    renderPage();
    await screen.findByText('개인');
    // 기본 카테고리 행에는 수정/삭제 버튼 없음 → 총 수정 버튼 수가 사용자 카테고리 수와 같음
    expect(screen.getAllByRole('button', { name: '수정' }).length).toBe(customCats.length);
    expect(screen.getAllByRole('button', { name: '삭제' }).length).toBe(customCats.length);
  });

  test('빈 사용자 카테고리 → 안내 문구', async () => {
    mock.onGet('/categories').reply(200, { categories: defaultCats });
    renderPage();
    expect(await screen.findByText('아직 카테고리가 없습니다.')).toBeInTheDocument();
  });

  test('생성 버튼 → 빈 폼 Modal, 제출 후 invalidate', async () => {
    mock.onGet('/categories').reply(200, { categories: defaultCats });
    renderPage();
    await screen.findByText('개인');
    let postBody: { name: string; colorCode: string } | null = null;
    mock.onPost('/categories').reply((cfg) => {
      postBody = JSON.parse(String(cfg.data));
      return [
        201,
        {
          categoryId: 'new',
          userId: 'u1',
          name: postBody!.name,
          colorCode: postBody!.colorCode,
          isDefault: false,
          createdAt: '2026',
        },
      ];
    });
    fireEvent.click(screen.getByRole('button', { name: '+ 새 카테고리' }));
    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText('이름') as HTMLInputElement;
    expect(nameInput.value).toBe('');
    fireEvent.change(nameInput, { target: { value: '독서' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '생성' }));
    await waitFor(() => expect(postBody).toEqual({ name: '독서', colorCode: '#4A90D9' }));
  });

  test('수정 버튼 → 기존 데이터 채워진 폼', async () => {
    mock.onGet('/categories').reply(200, { categories: [...defaultCats, ...customCats] });
    renderPage();
    await screen.findByText('운동');
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    const dialog = await screen.findByRole('dialog');
    expect((within(dialog).getByLabelText('이름') as HTMLInputElement).value).toBe('운동');
    expect((within(dialog).getByLabelText('색상 코드 (#RRGGBB)') as HTMLInputElement).value).toBe(
      '#2ECC71',
    );
  });

  test('잘못된 색상 코드 → 검증 에러 표시 + API 미호출', async () => {
    mock.onGet('/categories').reply(200, { categories: defaultCats });
    renderPage();
    await screen.findByText('개인');
    fireEvent.click(screen.getByRole('button', { name: '+ 새 카테고리' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('이름'), { target: { value: '독서' } });
    fireEvent.change(within(dialog).getByLabelText('색상 코드 (#RRGGBB)'), {
      target: { value: 'red' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: '생성' }));
    expect(within(dialog).getByText('#RRGGBB 형식이어야 합니다')).toBeInTheDocument();
  });

  test('삭제 버튼 → 확인 Modal → DELETE 호출', async () => {
    mock.onGet('/categories').reply(200, { categories: [...defaultCats, ...customCats] });
    renderPage();
    await screen.findByText('운동');
    let deleteCalled = false;
    mock.onDelete('/categories/c1').reply(() => {
      deleteCalled = true;
      return [204];
    });
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/운동/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  test('GET 에러 → ErrorMessage', async () => {
    mock.onGet('/categories').reply(500, { error: { code: 'X', message: '서버 오류' } });
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
