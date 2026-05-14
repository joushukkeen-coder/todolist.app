const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  if (!value) return '이메일을 입력해 주세요';
  if (!EMAIL_REGEX.test(value)) return '이메일 형식이 올바르지 않습니다';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return '비밀번호를 입력해 주세요';
  if (value.length < 8) return '비밀번호는 8자 이상이어야 합니다';
  return null;
}

export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '이름을 입력해 주세요';
  if (trimmed.length > 100) return '이름은 100자 이하여야 합니다';
  return null;
}
