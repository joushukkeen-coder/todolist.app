import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import { ROUTES } from './paths';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import HomePage from '@/pages/HomePage';
import CategoriesPage from '@/pages/CategoriesPage';
import ProfilePage from '@/pages/ProfilePage';

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.HOME}
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route
        path={ROUTES.CATEGORIES}
        element={
          <PrivateRoute>
            <CategoriesPage />
          </PrivateRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
