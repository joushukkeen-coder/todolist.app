import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '@/types/auth.types';

const sample: User = { userId: 'u1', email: 'a@b.com', name: 'A', createdAt: '2026-05-13' };

describe('authStore', () => {
  beforeEach(() => useAuthStore.getState().clearAuth());

  test('초기 상태: token·user 모두 null', () => {
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
  });

  test('setAuth → token·user 갱신', () => {
    useAuthStore.getState().setAuth('jwt-xyz', sample);
    const s = useAuthStore.getState();
    expect(s.token).toBe('jwt-xyz');
    expect(s.user).toEqual(sample);
  });

  test('clearAuth → 다시 null', () => {
    useAuthStore.getState().setAuth('jwt', sample);
    useAuthStore.getState().clearAuth();
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
  });

  test('JWT를 어떤 영속 저장소에도 기록하지 않는다', () => {
    const localSpy = vi.spyOn(Storage.prototype, 'setItem');
    const docCookieGet = vi.fn(() => '');
    const docCookieSet = vi.fn();
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: docCookieGet,
      set: docCookieSet,
    });

    useAuthStore.getState().setAuth('jwt-xyz', sample);
    useAuthStore.getState().clearAuth();

    expect(localSpy).not.toHaveBeenCalled();
    expect(docCookieSet).not.toHaveBeenCalled();
    localSpy.mockRestore();
  });
});

afterEach(() => useAuthStore.getState().clearAuth());
