import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import { ROUTES } from './paths';

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to={ROUTES.LOGIN} replace />;
  return <AppLayout>{children}</AppLayout>;
}
