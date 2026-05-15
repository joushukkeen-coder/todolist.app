import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import { useApplyLanguage, useChangeLanguage, useTranslation } from './useLanguage';
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
  document.documentElement.setAttribute('lang', 'ko');
});

afterEach(() => {
  document.documentElement.setAttribute('lang', 'ko');
});

describe('useApplyLanguage', () => {
  test('language=en → <html lang="en">', async () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      language: 'en',
      createdAt: '2026',
    });
    renderHook(() => useApplyLanguage());
    await waitFor(() => expect(document.documentElement.getAttribute('lang')).toBe('en'));
  });

  test('language 미설정 → lang="ko" (기본)', async () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      createdAt: '2026',
    });
    renderHook(() => useApplyLanguage());
    await waitFor(() => expect(document.documentElement.getAttribute('lang')).toBe('ko'));
  });
});

describe('useTranslation', () => {
  test('ko 사용자 → 한국어 문자열', () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      language: 'ko',
      createdAt: '2026',
    });
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('header.logout')).toBe('로그아웃');
    expect(result.current.t('home.title')).toBe('할일 목록');
    expect(result.current.language).toBe('ko');
  });

  test('en 사용자 → 영어 문자열', () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      language: 'en',
      createdAt: '2026',
    });
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('header.logout')).toBe('Logout');
    expect(result.current.t('home.title')).toBe('Todo list');
  });

  test('ja 사용자 → 일본어 문자열', () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      language: 'ja',
      createdAt: '2026',
    });
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('header.logout')).toBe('ログアウト');
    expect(result.current.t('home.title')).toBe('タスク一覧');
  });

  test('없는 키 → 키 자체 반환', () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      language: 'en',
      createdAt: '2026',
    });
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });
});

describe('useChangeLanguage', () => {
  test('mutate("ja") → PATCH 호출 + authStore.user.language 갱신', async () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      language: 'ko',
      createdAt: '2026',
    });
    let body: { language: string } | null = null;
    mock.onPatch('/users/me').reply((cfg) => {
      body = JSON.parse(String(cfg.data));
      return [
        200,
        { userId: 'u1', email: 'a@b.com', name: 'A', language: body!.language, createdAt: '2026' },
      ];
    });

    const { result } = renderHook(() => useChangeLanguage(), { wrapper });
    result.current.mutate('ja');
    await waitFor(() => expect(body).toEqual({ language: 'ja' }));
    await waitFor(() => expect(useAuthStore.getState().user?.language).toBe('ja'));
  });
});
