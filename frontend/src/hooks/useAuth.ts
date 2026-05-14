import { useMutation } from '@tanstack/react-query';
import { login, register } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest, RegisterRequest } from '@/types/auth.types';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
  });
}
