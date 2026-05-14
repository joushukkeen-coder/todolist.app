import { create } from 'zustand';
import type { User } from '@/types/auth.types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

// JWT는 메모리에만 보관한다. localStorage·sessionStorage·Cookie 사용 금지 (PRD §4.3).
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
}));
