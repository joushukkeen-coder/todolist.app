import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/router/paths';
import './Sidebar.css';

const ITEMS = [
  { to: ROUTES.HOME, label: '할일' },
  { to: ROUTES.CATEGORIES, label: '카테고리' },
  { to: ROUTES.PROFILE, label: '프로필' },
] as const;

export default function Sidebar() {
  return (
    <nav className="app-sidebar" aria-label="주 메뉴">
      <ul className="app-sidebar__list">
        {ITEMS.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end
              className={({ isActive }) =>
                ['app-sidebar__link', isActive ? 'app-sidebar__link--active' : '']
                  .filter(Boolean)
                  .join(' ')
              }
            >
              {it.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
