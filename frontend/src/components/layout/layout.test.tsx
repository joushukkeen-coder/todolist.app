import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import AppLayout from './AppLayout';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/router/paths';
import type { User } from '@/types/auth.types';

const sampleUser: User = { userId: 'u1', email: 'a@b.com', name: '홍길동', createdAt: '2026' };

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth('jwt', sampleUser);
});

function renderWithRouter(ui: React.ReactNode, initialPath = '/') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Header', () => {
  test('앱 이름 + 사용자 이름 표시', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('TodoListApp')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });

  test('로그아웃 클릭 → clearAuth + /login 이동', () => {
    function Probe() {
      return <div data-testid="probe">LOGIN_PAGE</div>;
    }
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Header />} />
            <Route path={ROUTES.LOGIN} element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(screen.getByTestId('probe')).toBeInTheDocument();
  });

  test('user가 없으면 이름 미표시', () => {
    useAuthStore.getState().clearAuth();
    renderWithRouter(<Header />);
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
  });

  test('다크 모드 토글 버튼: darkMode=false일 때 "🌙 다크" 라벨, aria-pressed=false', () => {
    useAuthStore.getState().setAuth('jwt', { ...sampleUser, darkMode: false });
    renderWithRouter(<Header />);
    const btn = screen.getByRole('button', { name: '다크 모드로 전환' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveTextContent('다크');
  });

  test('다크 모드 토글 버튼: darkMode=true일 때 "☀️ 라이트" 라벨, aria-pressed=true', () => {
    useAuthStore.getState().setAuth('jwt', { ...sampleUser, darkMode: true });
    renderWithRouter(<Header />);
    const btn = screen.getByRole('button', { name: '라이트 모드로 전환' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveTextContent('라이트');
  });

  test('언어 셀렉터: 3개 옵션(ko/en/ja) + 현재 값 반영', () => {
    useAuthStore.getState().setAuth('jwt', { ...sampleUser, language: 'en' });
    renderWithRouter(<Header />);
    const select = screen.getByRole('combobox', { name: 'Select language' }) as HTMLSelectElement;
    expect(select.value).toBe('en');
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(options).toEqual(['ko', 'en', 'ja']);
  });

  test('en 사용자 → 로그아웃 버튼 라벨이 "Logout"', () => {
    useAuthStore.getState().setAuth('jwt', { ...sampleUser, language: 'en' });
    renderWithRouter(<Header />);
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  test('ja 사용자 → 로그아웃 버튼 라벨이 "ログアウト"', () => {
    useAuthStore.getState().setAuth('jwt', { ...sampleUser, language: 'ja' });
    renderWithRouter(<Header />);
    expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
  });
});

describe('Sidebar', () => {
  test('3개 메뉴 링크 렌더', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByRole('link', { name: '할일' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '카테고리' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '프로필' })).toBeInTheDocument();
  });

  test('현재 경로에 따라 active 클래스 부여', () => {
    renderWithRouter(<Sidebar />, ROUTES.CATEGORIES);
    const cat = screen.getByRole('link', { name: '카테고리' });
    const todo = screen.getByRole('link', { name: '할일' });
    expect(cat.className).toMatch(/--active/);
    expect(todo.className).not.toMatch(/--active/);
  });

  test('aria-label="주 메뉴"', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByRole('navigation', { name: '주 메뉴' })).toBeInTheDocument();
  });
});

describe('BottomNav', () => {
  test('3개 항목 렌더 + aria-label="하단 메뉴"', () => {
    renderWithRouter(<BottomNav />);
    expect(screen.getByRole('navigation', { name: '하단 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '할일' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '카테고리' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '프로필' })).toBeInTheDocument();
  });

  test('활성 라우트에 active 클래스', () => {
    renderWithRouter(<BottomNav />, ROUTES.PROFILE);
    expect(screen.getByRole('link', { name: '프로필' }).className).toMatch(/--active/);
  });
});

describe('AppLayout', () => {
  test('Header·Sidebar·BottomNav·children 모두 렌더', () => {
    renderWithRouter(
      <AppLayout>
        <p data-testid="child">본문</p>
      </AppLayout>,
    );
    expect(screen.getByText('TodoListApp')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '주 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '하단 메뉴' })).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('본문');
  });

  test('children은 <main> 안에 렌더', () => {
    renderWithRouter(
      <AppLayout>
        <h1>할일 목록</h1>
      </AppLayout>,
    );
    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByRole('heading', { name: '할일 목록' }));
  });
});

describe('미디어 쿼리 분기 (CSS 검증)', () => {
  test('Sidebar CSS에 1023.98px max-width + display:none 분기', async () => {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const css = await readFile(
      path.resolve(process.cwd(), 'src/components/layout/Sidebar.css'),
      'utf-8',
    );
    expect(css).toMatch(/max-width:\s*1023\.98px/);
    expect(css).toMatch(/display:\s*none/);
  });
  test('BottomNav CSS에 1024px min-width + display:none 분기', async () => {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const css = await readFile(
      path.resolve(process.cwd(), 'src/components/layout/BottomNav.css'),
      'utf-8',
    );
    expect(css).toMatch(/min-width:\s*1024px/);
    expect(css).toMatch(/display:\s*none/);
  });
});
