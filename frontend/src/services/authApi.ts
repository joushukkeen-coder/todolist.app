import { apiClient } from './apiClient';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types/auth.types';

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/register', payload);
  return data;
}
