import { describe, test, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

beforeEach(() => useAuthStore.getState().clearAuth());

describe('authStore', () => {
  test('초기 상태는 token/user 모두 null', () => {
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  test('setAuth → token/user 갱신', () => {
    useAuthStore.getState().setAuth('jwt.token.value', {
      userId: 'u1',
      email: 'a@example.com',
      name: 'A',
      createdAt: '2026-05-13',
    });
    const { token, user } = useAuthStore.getState();
    expect(token).toBe('jwt.token.value');
    expect(user?.email).toBe('a@example.com');
  });

  test('clearAuth → 모두 null로 초기화', () => {
    useAuthStore.getState().setAuth('t', {
      userId: 'u1',
      email: 'a@example.com',
      name: 'A',
      createdAt: '2026-05-13',
    });
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
