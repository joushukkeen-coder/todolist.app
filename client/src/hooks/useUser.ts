import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteAccount, getMe, updateProfile, type UpdateProfilePayload } from '@/services/userApi';
import { useAuthStore } from '@/store/authStore';

const ME_KEY = ['users', 'me'] as const;

export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: getMe });
}

export function useUpdateProfile() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (user) => {
      if (token) setAuth(token, user);
      queryClient.setQueryData(ME_KEY, user);
    },
  });
}

export function useDeleteAccount() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: () => {
      clearAuth();
    },
  });
}
