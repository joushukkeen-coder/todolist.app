import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from './paths';

interface Props {
  children: ReactNode;
}

export default function PrivateRoute({ children }: Props) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <>{children}</>;
}
