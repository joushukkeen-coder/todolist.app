import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/services/userApi';
import { translate } from '@/i18n/messages';
import type { Language } from '@/types/auth.types';

/**
 * authStore.user.language를 <html lang> 속성에 반영한다.
 * AppLayout에서 한 번 호출.
 */
export function useApplyLanguage() {
  const language = useAuthStore((s) => s.user?.language);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('lang', language ?? 'ko');
  }, [language]);
}

/**
 * 현재 언어를 기준으로 t(key)를 반환하는 훅.
 * 컴포넌트에서 `const { t } = useTranslation();` 형태로 사용.
 */
export function useTranslation() {
  const language: Language = useAuthStore((s) => s.user?.language) ?? 'ko';
  return {
    language,
    t: (key: string) => translate(language, key),
  };
}

/**
 * 언어 변경 mutation. PATCH /users/me { language } 호출 후 authStore.user 즉시 갱신.
 */
export function useChangeLanguage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (next: Language) => updateProfile({ language: next }),
    onSuccess: (updated) => {
      if (token && user) setAuth(token, { ...user, ...updated });
    },
  });
}
