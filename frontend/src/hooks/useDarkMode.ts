import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/services/userApi';

/**
 * authStore.user.darkMode 값을 <html data-theme> 속성에 반영한다.
 * 컴포넌트 트리 상단(예: AppLayout)에서 한 번 호출하면 충분.
 */
export function useApplyDarkMode() {
  const darkMode = useAuthStore((s) => s.user?.darkMode);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);
}

/**
 * 다크 모드 토글 mutation. 성공 시 authStore.user를 즉시 갱신해
 * 별도 invalidate 없이 useApplyDarkMode가 DOM에 반영하도록 한다.
 */
export function useToggleDarkMode() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (next: boolean) => updateProfile({ darkMode: next }),
    onSuccess: (updated) => {
      if (token && user) setAuth(token, { ...user, ...updated });
    },
  });
}
