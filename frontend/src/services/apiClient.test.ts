import { describe, test, expect, beforeEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from './apiClient';
import { useAuthStore } from '@/store/authStore';

const mock = new MockAdapter(apiClient);

beforeEach(() => {
  mock.reset();
  useAuthStore.getState().clearAuth();
});

describe('apiClient', () => {
  test('baseURL이 VITE_API_BASE_URL 환경값을 따른다', () => {
    expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL);
    expect(apiClient.defaults.baseURL).toMatch(/\/api\/v1$/);
  });

  test('토큰이 있으면 Authorization Bearer 헤더가 자동 부착', async () => {
    useAuthStore.getState().setAuth('jwt-abc', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      createdAt: '2026',
    });
    let captured: string | undefined;
    mock.onGet('/categories').reply((cfg) => {
      captured = cfg.headers?.['Authorization'] as string | undefined;
      return [200, { categories: [] }];
    });
    await apiClient.get('/categories');
    expect(captured).toBe('Bearer jwt-abc');
  });

  test('토큰이 없으면 Authorization 헤더가 비어 있음', async () => {
    let captured: string | undefined;
    mock.onGet('/categories').reply((cfg) => {
      captured = cfg.headers?.['Authorization'] as string | undefined;
      return [200, { categories: [] }];
    });
    await apiClient.get('/categories');
    expect(captured).toBeUndefined();
  });

  test('401 응답 → clearAuth + /login 리다이렉트', async () => {
    useAuthStore.getState().setAuth('jwt', {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      createdAt: '2026',
    });
    const assignSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/', assign: assignSpy },
    });
    mock.onGet('/users/me').reply(401, { error: { code: 'UNAUTHORIZED', message: '' } });

    await expect(apiClient.get('/users/me')).rejects.toBeDefined();
    expect(useAuthStore.getState().token).toBeNull();
    expect(assignSpy).toHaveBeenCalledWith('/login');

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  test('이미 /login 경로에서 401이면 재리다이렉트 안 함', async () => {
    const assignSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/login', assign: assignSpy },
    });
    mock.onPost('/auth/login').reply(401, { error: { code: 'INVALID_CREDENTIALS', message: '' } });

    await expect(apiClient.post('/auth/login', {})).rejects.toBeDefined();
    expect(assignSpy).not.toHaveBeenCalled();

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });
});
