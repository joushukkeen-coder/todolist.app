import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import { useApplyDarkMode, useToggleDarkMode } from './useDarkMode';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

const mock = new MockAdapter(apiClient);

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mock.reset();
  useAuthStore.getState().clearAuth();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

describe('useApplyDarkMode', () => {
  test('darkMode=true → html[data-theme="dark"] 설정', async () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      darkMode: true,
      createdAt: '2026',
    });
    renderHook(() => useApplyDarkMode());
    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('dark'));
  });

  test('darkMode=false → 속성 제거', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      darkMode: false,
      createdAt: '2026',
    });
    renderHook(() => useApplyDarkMode());
    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBeNull());
  });
});

describe('useToggleDarkMode', () => {
  test('mutate(true) → PATCH /users/me 호출 + authStore.user.darkMode 갱신', async () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      darkMode: false,
      createdAt: '2026',
    });
    let body: { darkMode: boolean } | null = null;
    mock.onPatch('/users/me').reply((cfg) => {
      body = JSON.parse(String(cfg.data));
      return [
        200,
        { userId: 'u1', email: 'a@b.com', name: 'A', darkMode: body!.darkMode, createdAt: '2026' },
      ];
    });

    const { result } = renderHook(() => useToggleDarkMode(), { wrapper });
    result.current.mutate(true);
    await waitFor(() => expect(body).toEqual({ darkMode: true }));
    await waitFor(() => expect(useAuthStore.getState().user?.darkMode).toBe(true));
  });
});
