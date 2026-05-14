import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/router/paths';
import './BottomNav.css';

const ITEMS = [
  { to: ROUTES.HOME, label: '할일' },
  { to: ROUTES.CATEGORIES, label: '카테고리' },
  { to: ROUTES.PROFILE, label: '프로필' },
] as const;

export default function BottomNav() {
  return (
    <nav className="app-bottom-nav" aria-label="하단 메뉴">
      {ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end
          className={({ isActive }) =>
            ['app-bottom-nav__item', isActive ? 'app-bottom-nav__item--active' : '']
              .filter(Boolean)
              .join(' ')
          }
        >
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
