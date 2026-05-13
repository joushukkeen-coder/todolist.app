import { describe, test, expect } from 'vitest';
import { validateEmail, validatePassword, validateName } from './validators';

describe('validateEmail', () => {
  test.each([
    ['', '이메일을 입력해 주세요'],
    ['invalid', '올바른 이메일 형식이 아닙니다'],
    ['a@b', '올바른 이메일 형식이 아닙니다'],
  ])('"%s" → "%s"', (input, expected) => {
    expect(validateEmail(input)).toBe(expected);
  });
  test('정상 이메일 → null', () => {
    expect(validateEmail('a@b.com')).toBeNull();
  });
});

describe('validatePassword', () => {
  test('빈값 → 입력 안내', () => expect(validatePassword('')).toBe('비밀번호를 입력해 주세요'));
  test('7자 → 길이 안내', () =>
    expect(validatePassword('1234567')).toBe('비밀번호는 8자 이상이어야 합니다'));
  test('8자 → null', () => expect(validatePassword('12345678')).toBeNull());
});

describe('validateName', () => {
  test('빈값/공백 → 안내', () => {
    expect(validateName('')).toBe('이름을 입력해 주세요');
    expect(validateName('   ')).toBe('이름을 입력해 주세요');
  });
  test('정상 → null', () => expect(validateName('홍길동')).toBeNull());
});
