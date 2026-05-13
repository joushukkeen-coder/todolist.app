import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/router/paths';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: ROUTES.HOME, label: '할일' },
  { to: ROUTES.CATEGORIES, label: '카테고리' },
  { to: ROUTES.PROFILE, label: '프로필' },
] as const;

export default function Sidebar() {
  return (
    <nav className="app-sidebar" aria-label="주요 메뉴">
      <ul className="app-sidebar__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === ROUTES.HOME}
              className={({ isActive }) =>
                `app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
