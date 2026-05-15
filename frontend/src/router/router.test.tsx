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

const sampleUser: User = { userId: 'u1', email: 'a@b.com', name: 'A', createdAt: '2026-05-13' };

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  apiMock.reset();
  apiMock.onGet('/users/me').reply(200, sampleUser);
  apiMock.onGet('/categories').reply(200, { categories: [] });
  apiMock.onGet('/todos').reply(200, { todos: [] });
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

describe('ROUTES 상수', () => {
  test('5개 경로 정의', () => {
    expect(Object.values(ROUTES)).toEqual(['/', '/login', '/register', '/categories', '/profile']);
  });
});

describe('PrivateRoute (미인증)', () => {
  test('/ → /login 리다이렉트', () => {
    renderAt(ROUTES.HOME);
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
  test('/categories → /login 리다이렉트', () => {
    renderAt(ROUTES.CATEGORIES);
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
  test('/profile → /login 리다이렉트', () => {
    renderAt(ROUTES.PROFILE);
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
});

describe('PrivateRoute (인증)', () => {
  beforeEach(() => useAuthStore.getState().setAuth('jwt', sampleUser));

  test('/ → 할일 목록', async () => {
    renderAt(ROUTES.HOME);
    expect(await screen.findByRole('button', { name: '+ 새 할일' })).toBeInTheDocument();
  });
  test('/categories → 카테고리', async () => {
    renderAt(ROUTES.CATEGORIES);
    expect(await screen.findByRole('heading', { name: '카테고리' })).toBeInTheDocument();
  });
  test('/profile → 프로필', async () => {
    renderAt(ROUTES.PROFILE);
    expect(await screen.findByRole('heading', { name: '프로필' })).toBeInTheDocument();
  });
});

describe('PublicRoute (인증 사용자 → / 리다이렉트)', () => {
  beforeEach(() => useAuthStore.getState().setAuth('jwt', sampleUser));

  test('/login → 홈', async () => {
    renderAt(ROUTES.LOGIN);
    expect(await screen.findByRole('button', { name: '+ 새 할일' })).toBeInTheDocument();
  });
  test('/register → 홈', async () => {
    renderAt(ROUTES.REGISTER);
    expect(await screen.findByRole('button', { name: '+ 새 할일' })).toBeInTheDocument();
  });
});

describe('PublicRoute (미인증)', () => {
  test('/login 직접 접근 가능', () => {
    renderAt(ROUTES.LOGIN);
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
  test('/register 직접 접근 가능', () => {
    renderAt(ROUTES.REGISTER);
    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
  });
});

describe('Catch-all', () => {
  test('알 수 없는 경로 → / 로 리다이렉트 (미인증 시 /login으로 한번 더)', () => {
    renderAt('/unknown-path');
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
  test('인증 사용자가 알 수 없는 경로 → 홈', async () => {
    useAuthStore.getState().setAuth('jwt', sampleUser);
    renderAt('/unknown-path');
    expect(await screen.findByRole('button', { name: '+ 새 할일' })).toBeInTheDocument();
  });
});

describe('새로고침 시뮬레이션', () => {
  test('clearAuth 후 보호 라우트 접근 시 /login', () => {
    useAuthStore.getState().setAuth('jwt', sampleUser);
    useAuthStore.getState().clearAuth();
    renderAt(ROUTES.HOME);
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
});
