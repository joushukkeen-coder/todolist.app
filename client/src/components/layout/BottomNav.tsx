import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/router/paths';
import './BottomNav.css';

const NAV_ITEMS = [
  { to: ROUTES.HOME, label: '할일' },
  { to: ROUTES.CATEGORIES, label: '카테고리' },
  { to: ROUTES.PROFILE, label: '프로필' },
] as const;

export default function BottomNav() {
  return (
    <nav className="app-bottom-nav" aria-label="모바일 메뉴">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === ROUTES.HOME}
          className={({ isActive }) =>
            `app-bottom-nav__link${isActive ? ' app-bottom-nav__link--active' : ''}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
