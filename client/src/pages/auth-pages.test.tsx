import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/router/paths';

const mock = new MockAdapter(apiClient);

beforeEach(() => {
  mock.reset();
  useAuthStore.getState().clearAuth();
});

function renderWithProviders(initialPath: string, pageElement: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.HOME} element={<div>홈</div>} />
          <Route path="*" element={pageElement} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  test('잘못된 이메일·짧은 비밀번호 → Input 하단 에러', () => {
    renderWithProviders(ROUTES.LOGIN, null);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(screen.getByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument();
    expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument();
  });

  test('정상 로그인 → setAuth + / 이동', async () => {
    mock.onPost('/auth/login').reply(200, {
      accessToken: 'jwt.token',
      user: { userId: 'u1', email: 'a@b.com', name: 'A', createdAt: '2026' },
    });
    renderWithProviders(ROUTES.LOGIN, null);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password1' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    await waitFor(() => expect(useAuthStore.getState().token).toBe('jwt.token'));
    await screen.findByText('홈');
  });

  test('401 에러 시 ErrorMessage 표시', async () => {
    mock.onPost('/auth/login').reply(401, {
      error: { code: 'INVALID_CREDENTIALS', message: '자격 증명이 잘못되었습니다' },
    });
    renderWithProviders(ROUTES.LOGIN, null);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password1' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('자격 증명이 잘못되었습니다'),
    );
    expect(useAuthStore.getState().token).toBeNull();
  });

  test('회원가입 링크 존재', () => {
    renderWithProviders(ROUTES.LOGIN, null);
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', ROUTES.REGISTER);
  });
});

describe('RegisterPage', () => {
  test('필수값 누락 → 3개 에러 모두 표시', () => {
    renderWithProviders(ROUTES.REGISTER, null);
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    expect(screen.getByText('이메일을 입력해 주세요')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해 주세요')).toBeInTheDocument();
    expect(screen.getByText('이름을 입력해 주세요')).toBeInTheDocument();
  });

  test('정상 회원가입 → /login 이동', async () => {
    mock.onPost('/auth/register').reply(201, {
      userId: 'u1',
      email: 'a@b.com',
      name: 'A',
      createdAt: '2026',
    });
    renderWithProviders(ROUTES.REGISTER, null);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password1' } });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '테스터' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    // 정상 등록 후 /login으로 redirect되어 LoginPage 렌더
    await screen.findByRole('button', { name: '로그인' });
  });

  test('409 중복 → ErrorMessage 표시', async () => {
    mock.onPost('/auth/register').reply(409, {
      error: { code: 'EMAIL_ALREADY_EXISTS', message: '이미 등록된 이메일입니다' },
    });
    renderWithProviders(ROUTES.REGISTER, null);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password1' } });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '테스터' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('이미 등록된 이메일입니다'),
    );
  });

  test('로그인 링크 존재', () => {
    renderWithProviders(ROUTES.REGISTER, null);
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', ROUTES.LOGIN);
  });
});

describe('JWT 저장 방식', () => {
  test('localStorage/sessionStorage 호출 없이 메모리에만 저장', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    mock.onPost('/auth/login').reply(200, {
      accessToken: 'jwt.token',
      user: { userId: 'u1', email: 'a@b.com', name: 'A', createdAt: '2026' },
    });
    renderWithProviders(ROUTES.LOGIN, null);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password1' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    await waitFor(() => expect(useAuthStore.getState().token).toBe('jwt.token'));
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
