import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from './paths';

export default function PublicRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to={ROUTES.HOME} replace />;
  return <>{children}</>;
}
