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
  test('baseURL이 VITE_API_BASE_URL을 사용', () => {
    expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL);
  });

  test('요청 인터셉터: 토큰 있으면 Authorization: Bearer 자동 주입', async () => {
    useAuthStore.getState().setAuth('my-token', {
      userId: 'u1',
      email: 'a@example.com',
      name: 'A',
      createdAt: '2026-05-13',
    });
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer my-token');
      return [200, { ok: true }];
    });
    await apiClient.get('/test');
  });

  test('요청 인터셉터: 토큰 없으면 Authorization 헤더 없음', async () => {
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, {}];
    });
    await apiClient.get('/test');
  });

  test('응답 인터셉터: 401 → clearAuth() + /login 리다이렉트', async () => {
    useAuthStore.getState().setAuth('expired', {
      userId: 'u1',
      email: 'a@example.com',
      name: 'A',
      createdAt: '2026-05-13',
    });
    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/dashboard', assign: assignSpy },
    });
    mock.onGet('/protected').reply(401, { error: { code: 'UNAUTHORIZED', message: '' } });
    await expect(apiClient.get('/protected')).rejects.toBeDefined();
    expect(useAuthStore.getState().token).toBeNull();
    expect(assignSpy).toHaveBeenCalledWith('/login');
  });

  test('응답 인터셉터: non-401은 통과 (clearAuth 미호출)', async () => {
    useAuthStore.getState().setAuth('valid', {
      userId: 'u1',
      email: 'a@example.com',
      name: 'A',
      createdAt: '2026-05-13',
    });
    mock.onGet('/bad').reply(400, { error: { code: 'VALIDATION_ERROR', message: 'x' } });
    await expect(apiClient.get('/bad')).rejects.toBeDefined();
    expect(useAuthStore.getState().token).toBe('valid');
  });
});
