import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import AppRouter from './index';
import { ROUTES } from './paths';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import type { User } from '@/types/auth.types';

const apiMock = new MockAdapter(apiClient);
const sampleUser: User = {
  userId: 'u1',
  email: 'a@example.com',
  name: 'A',
  createdAt: '2026-05-13',
};

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  apiMock.reset();
  apiMock.onGet('/users/me').reply(200, sampleUser);
});

function renderAt(path: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ROUTES 경로 상수', () => {
  test('5개 경로 정의', () => {
    expect(Object.values(ROUTES)).toEqual(['/', '/login', '/register', '/categories', '/profile']);
  });
});

describe('PrivateRoute (미인증 → /login)', () => {
  test('/ 접근 시 로그인 페이지로 리다이렉트', () => {
    renderAt(ROUTES.HOME);
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
  test('/categories 접근 시 로그인 페이지로 리다이렉트', () => {
    renderAt(ROUTES.CATEGORIES);
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
  test('/profile 접근 시 로그인 페이지로 리다이렉트', () => {
    renderAt(ROUTES.PROFILE);
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
});

describe('PrivateRoute (인증 → children 렌더)', () => {
  beforeEach(() => useAuthStore.getState().setAuth('jwt', sampleUser));

  test('/ → 할일 목록', async () => {
    apiMock.onGet('/todos').reply(200, { todos: [] });
    apiMock.onGet('/categories').reply(200, { categories: [] });
    renderAt(ROUTES.HOME);
    expect(await screen.findByRole('heading', { name: '할일 목록' })).toBeInTheDocument();
  });
  test('/categories → 카테고리', async () => {
    apiMock.onGet('/categories').reply(200, { categories: [] });
    renderAt(ROUTES.CATEGORIES);
    expect(await screen.findByRole('heading', { name: '카테고리' })).toBeInTheDocument();
  });
  test('/profile → 프로필', async () => {
    renderAt(ROUTES.PROFILE);
    expect(await screen.findByRole('heading', { name: '프로필' })).toBeInTheDocument();
  });
});

describe('PublicRoute (인증 사용자가 /login·/register → / 리다이렉트)', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth('jwt', sampleUser);
    apiMock.onGet('/todos').reply(200, { todos: [] });
    apiMock.onGet('/categories').reply(200, { categories: [] });
  });

  test('/login 접근 시 홈으로', async () => {
    renderAt(ROUTES.LOGIN);
    expect(await screen.findByRole('heading', { name: '할일 목록' })).toBeInTheDocument();
  });
  test('/register 접근 시 홈으로', async () => {
    renderAt(ROUTES.REGISTER);
    expect(await screen.findByRole('heading', { name: '할일 목록' })).toBeInTheDocument();
  });
});

describe('Catch-all 라우트', () => {
  test('미정의 경로 → 홈으로 리다이렉트', async () => {
    useAuthStore.getState().setAuth('jwt', sampleUser);
    apiMock.onGet('/todos').reply(200, { todos: [] });
    apiMock.onGet('/categories').reply(200, { categories: [] });
    renderAt('/unknown');
    expect(await screen.findByRole('heading', { name: '할일 목록' })).toBeInTheDocument();
  });
});

describe('새로고침 시 authStore 초기화 → 로그인 페이지', () => {
  test('clearAuth 후 보호 라우트 접근 시 로그인 페이지로', () => {
    useAuthStore.getState().setAuth('jwt', sampleUser);
    useAuthStore.getState().clearAuth(); // 새로고침 시뮬레이션
    renderAt(ROUTES.HOME);
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
});
