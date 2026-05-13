import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import AppLayout from './AppLayout';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/router/paths';

const sampleUser = {
  userId: 'u1',
  email: 'a@example.com',
  name: '홍길동',
  createdAt: '2026-05-13',
};

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  navigateMock.mockClear();
});

function renderAt(path: string, ui: React.ReactNode) {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}

describe('Header', () => {
  test('앱 이름 + 로그아웃 버튼 표시', () => {
    renderAt('/', <Header />);
    expect(screen.getByText('TodoListApp')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });

  test('로그인 사용자 이름 표시', () => {
    useAuthStore.getState().setAuth('jwt', sampleUser);
    renderAt('/', <Header />);
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  test('로그아웃 클릭 → clearAuth + /login navigate', () => {
    useAuthStore.getState().setAuth('jwt', sampleUser);
    renderAt('/', <Header />);
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.LOGIN, { replace: true });
  });
});

describe('Sidebar', () => {
  test('3개 네비게이션 링크 렌더', () => {
    renderAt('/', <Sidebar />);
    expect(screen.getByRole('link', { name: '할일' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '카테고리' })).toHaveAttribute('href', '/categories');
    expect(screen.getByRole('link', { name: '프로필' })).toHaveAttribute('href', '/profile');
  });

  test('현재 경로 링크에 active 클래스 적용', () => {
    renderAt('/categories', <Sidebar />);
    const link = screen.getByRole('link', { name: '카테고리' });
    expect(link.className).toContain('app-sidebar__link--active');
  });
});

describe('BottomNav', () => {
  test('3개 모바일 메뉴 링크 + 활성 스타일', () => {
    renderAt('/profile', <BottomNav />);
    expect(screen.getByRole('link', { name: '할일' })).toBeInTheDocument();
    const profileLink = screen.getByRole('link', { name: '프로필' });
    expect(profileLink.className).toContain('app-bottom-nav__link--active');
  });
});

describe('AppLayout', () => {
  test('Header + Sidebar + BottomNav + main 모두 렌더', () => {
    renderAt(
      '/',
      <Routes>
        <Route path="/" element={<AppLayout>본문</AppLayout>} />
      </Routes>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeInTheDocument(); // Sidebar
    expect(screen.getByRole('navigation', { name: '모바일 메뉴' })).toBeInTheDocument(); // BottomNav
    expect(screen.getByRole('main')).toHaveTextContent('본문');
  });
});

describe('CSS 1024px 브레이크포인트', () => {
  test('Sidebar.css / BottomNav.css에 정확히 1024px 분기 존재', async () => {
    const fs = await import('node:fs/promises');
    const sidebarCss = await fs.readFile('src/components/layout/Sidebar.css', 'utf8');
    const bottomCss = await fs.readFile('src/components/layout/BottomNav.css', 'utf8');
    expect(sidebarCss).toMatch(/@media\s*\(min-width:\s*1024px\)/);
    expect(bottomCss).toMatch(/@media\s*\(min-width:\s*1024px\)/);
  });
});
