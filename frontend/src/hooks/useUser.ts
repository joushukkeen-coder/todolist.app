import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, updateProfile, changePassword, deleteAccount } from '@/services/userApi';
import { useAuthStore } from '@/store/authStore';

const ME_KEY = ['users', 'me'] as const;

export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: getMe });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (payload: { name: string }) => updateProfile(payload),
    onSuccess: (updated) => {
      qc.setQueryData(ME_KEY, updated);
      if (token) setAuth(token, updated);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      changePassword(payload),
  });
}

export function useDeleteAccount() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: () => clearAuth(),
  });
}
