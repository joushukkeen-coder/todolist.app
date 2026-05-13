import { apiClient } from './apiClient';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types/auth.types';

export async function registerApi(payload: RegisterRequest): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/register', payload);
  return data;
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}
