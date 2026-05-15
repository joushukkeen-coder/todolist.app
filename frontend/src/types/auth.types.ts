export type Language = 'ko' | 'en' | 'ja';

export interface User {
  userId: string;
  email: string;
  name: string;
  darkMode?: boolean;
  language?: Language;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}
