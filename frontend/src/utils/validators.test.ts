import { describe, test, expect } from 'vitest';
import { validateEmail, validatePassword, validateName } from './validators';

describe('validateEmail', () => {
  test('빈 값 → 입력 요구', () => expect(validateEmail('')).toBe('이메일을 입력해 주세요'));
  test('잘못된 형식', () => expect(validateEmail('abc')).toBe('이메일 형식이 올바르지 않습니다'));
  test('정상 → null', () => expect(validateEmail('a@b.com')).toBeNull());
});

describe('validatePassword', () => {
  test('빈 값', () => expect(validatePassword('')).toBe('비밀번호를 입력해 주세요'));
  test('7자', () => expect(validatePassword('1234567')).toBe('비밀번호는 8자 이상이어야 합니다'));
  test('8자 → null', () => expect(validatePassword('12345678')).toBeNull());
});

describe('validateName', () => {
  test('공백만', () => expect(validateName('   ')).toBe('이름을 입력해 주세요'));
  test('101자', () => expect(validateName('a'.repeat(101))).toBe('이름은 100자 이하여야 합니다'));
  test('정상', () => expect(validateName('홍길동')).toBeNull());
});
