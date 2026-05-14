import { describe, test, expect } from 'vitest';
import { apiBaseUrl } from './env';

describe('apiBaseUrl', () => {
  test('VITE_API_BASE_URL 값이 문자열로 노출된다', () => {
    expect(typeof apiBaseUrl).toBe('string');
    expect(apiBaseUrl.length).toBeGreaterThan(0);
  });

  test('백엔드 API 경로 형태(/api/v1)를 포함한다', () => {
    expect(apiBaseUrl).toMatch(/\/api\/v1$/);
  });
});
