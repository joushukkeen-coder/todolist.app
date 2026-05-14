import { describe, test, expect, beforeEach } from 'vitest';
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

function HomeStub() {
  return <h1>홈</h1>;
}
function LoginStub() {
  return <h1>로그인 페이지</h1>;
}

function renderLogin() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ROUTES.LOGIN]}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.HOME} element={<HomeStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
function renderRegister() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ROUTES.REGISTER]}>
        <Routes>
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mock.reset();
  useAuthStore.getState().clearAuth();
});

describe('LoginPage', () => {
  test('빈 폼 제출 → 이메일·비번 검증 에러 표시', () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(screen.getByText('이메일을 입력해 주세요')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해 주세요')).toBeInTheDocument();
  });

  test('잘못된 이메일 형식 → 에러', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(screen.getByText('이메일 형식이 올바르지 않습니다')).toBeInTheDocument();
  });

  test('비밀번호 8자 미만 → 에러', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument();
  });

  test('로그인 성공 → authStore 갱신 + 홈으로 이동', async () => {
    mock.onPost('/auth/login').reply(200, {
      accessToken: 'jwt-token',
      user: { userId: 'u1', email: 'a@b.com', name: 'A', createdAt: '2026' },
    });
    renderLogin();
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }));

    await waitFor(() => expect(useAuthStore.getState().token).toBe('jwt-token'));
    expect(useAuthStore.getState().user?.email).toBe('a@b.com');
    expect(screen.getByRole('heading', { name: '홈' })).toBeInTheDocument();
  });

  test('서버 401 → ErrorMessage 표시', async () => {
    mock.onPost('/auth/login').reply(401, {
      error: { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다' },
    });
    renderLogin();
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }));
    await waitFor(() =>
      expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeInTheDocument(),
    );
    expect(useAuthStore.getState().token).toBeNull();
  });

  test('회원가입 페이지 링크 존재', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', ROUTES.REGISTER);
  });
});

describe('RegisterPage', () => {
  test('빈 폼 제출 → 3개 검증 에러', () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    expect(screen.getByText('이메일을 입력해 주세요')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해 주세요')).toBeInTheDocument();
    expect(screen.getByText('이름을 입력해 주세요')).toBeInTheDocument();
  });

  test('성공 → 로그인 페이지로 이동', async () => {
    let postBody: { email: string; password: string; name: string } | null = null;
    mock.onPost('/auth/register').reply((cfg) => {
      postBody = JSON.parse(String(cfg.data));
      return [
        201,
        { userId: 'u1', email: postBody!.email, name: postBody!.name, createdAt: '2026' },
      ];
    });
    renderRegister();
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'new@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호 (8자 이상)'), {
      target: { value: 'pw12345678' },
    });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '신규' } });
    fireEvent.click(screen.getByRole('button', { name: /회원가입/ }));

    await waitFor(() =>
      expect(postBody).toEqual({ email: 'new@b.com', password: 'pw12345678', name: '신규' }),
    );
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '로그인 페이지' })).toBeInTheDocument(),
    );
  });

  test('서버 409 (이메일 중복) → ErrorMessage', async () => {
    mock.onPost('/auth/register').reply(409, {
      error: { code: 'EMAIL_ALREADY_EXISTS', message: '이미 등록된 이메일입니다' },
    });
    renderRegister();
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'dup@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호 (8자 이상)'), {
      target: { value: 'pw12345678' },
    });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍' } });
    fireEvent.click(screen.getByRole('button', { name: /회원가입/ }));
    await waitFor(() => expect(screen.getByText('이미 등록된 이메일입니다')).toBeInTheDocument());
  });

  test('로그인 페이지 링크 존재', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', ROUTES.LOGIN);
  });
});
