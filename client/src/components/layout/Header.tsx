import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/router/paths';
import Button from '@/components/common/Button';
import './Header.css';

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header className="app-header" role="banner">
      <h1 className="app-header__title">TodoListApp</h1>
      <div className="app-header__user">
        {user && <span className="app-header__name">{user.name}</span>}
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </header>
  );
}
