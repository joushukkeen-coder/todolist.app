import { apiClient } from './apiClient';
import type { User } from '@/types/auth.types';

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
}

export async function updateProfile(payload: { name: string }): Promise<User> {
  const { data } = await apiClient.patch<User>('/users/me', payload);
  return data;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.patch('/users/me/password', payload);
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete('/users/me');
}
