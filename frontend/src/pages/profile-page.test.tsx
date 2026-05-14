import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import ProfilePage from './ProfilePage';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/router/paths';
import type { User } from '@/types/auth.types';

const mock = new MockAdapter(apiClient);
const baseUser: User = {
  userId: 'u1',
  email: 'a@b.com',
  name: '홍길동',
  createdAt: '2026-05-13',
};

beforeEach(() => {
  mock.reset();
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth('jwt', baseUser);
  mock.onGet('/users/me').reply(200, baseUser);
});

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ROUTES.PROFILE]}>
        <Routes>
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.LOGIN} element={<h1>로그인 페이지</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProfilePage', () => {
  test('로딩 → 데이터 → 이름·이메일 표시, 이메일 disabled', async () => {
    renderPage();
    const emailInput = (await screen.findByLabelText('이메일')) as HTMLInputElement;
    expect(emailInput.value).toBe('a@b.com');
    expect(emailInput).toBeDisabled();
    expect((screen.getByLabelText('이름') as HTMLInputElement).value).toBe('홍길동');
  });

  test('이름 변경 PATCH 호출 + authStore 갱신', async () => {
    let body: { name: string } | null = null;
    mock.onPatch('/users/me').reply((cfg) => {
      body = JSON.parse(String(cfg.data));
      return [200, { ...baseUser, name: body!.name }];
    });
    renderPage();
    await screen.findByLabelText('이름');
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '김철수' } });
    fireEvent.click(screen.getByRole('button', { name: /이름 저장/ }));
    await waitFor(() => expect(body).toEqual({ name: '김철수' }));
    await waitFor(() => expect(useAuthStore.getState().user?.name).toBe('김철수'));
    expect(screen.getByText('이름이 변경되었습니다.')).toBeInTheDocument();
  });

  test('빈 이름 저장 → 검증 에러', async () => {
    renderPage();
    await screen.findByLabelText('이름');
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /이름 저장/ }));
    expect(screen.getByText('이름을 입력해 주세요')).toBeInTheDocument();
  });

  test('비밀번호 변경 정상 흐름', async () => {
    let body: { currentPassword: string; newPassword: string } | null = null;
    mock.onPatch('/users/me/password').reply((cfg) => {
      body = JSON.parse(String(cfg.data));
      return [204];
    });
    renderPage();
    await screen.findByLabelText('이름');
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'CurrPw1234' } });
    fireEvent.change(screen.getByLabelText('새 비밀번호 (8자 이상)'), {
      target: { value: 'NewPw1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /비밀번호 저장/ }));
    await waitFor(() =>
      expect(body).toEqual({ currentPassword: 'CurrPw1234', newPassword: 'NewPw1234' }),
    );
    expect(screen.getByText('비밀번호가 변경되었습니다.')).toBeInTheDocument();
    // 폼 초기화
    expect((screen.getByLabelText('현재 비밀번호') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('새 비밀번호 (8자 이상)') as HTMLInputElement).value).toBe('');
  });

  test('새 비번 8자 미만 → 검증 에러', async () => {
    renderPage();
    await screen.findByLabelText('이름');
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'CurrPw1234' } });
    fireEvent.change(screen.getByLabelText('새 비밀번호 (8자 이상)'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /비밀번호 저장/ }));
    expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument();
  });

  test('비번 변경 401 → ErrorMessage', async () => {
    mock.onPatch('/users/me/password').reply(401, {
      error: { code: 'INVALID_CURRENT_PASSWORD', message: '현재 비밀번호가 올바르지 않습니다' },
    });
    renderPage();
    await screen.findByLabelText('이름');
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'wrong___' } });
    fireEvent.change(screen.getByLabelText('새 비밀번호 (8자 이상)'), {
      target: { value: 'NewPw1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /비밀번호 저장/ }));
    await waitFor(() =>
      expect(screen.getByText('현재 비밀번호가 올바르지 않습니다')).toBeInTheDocument(),
    );
  });

  test('회원 탈퇴 버튼 → 확인 모달 → 취소', async () => {
    renderPage();
    await screen.findByLabelText('이름');
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(useAuthStore.getState().token).toBe('jwt'); // 그대로
  });

  test('회원 탈퇴 확정 → DELETE + clearAuth + /login 이동', async () => {
    let deleted = false;
    mock.onDelete('/users/me').reply(() => {
      deleted = true;
      return [204];
    });
    renderPage();
    await screen.findByLabelText('이름');
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '탈퇴' }));
    await waitFor(() => expect(deleted).toBe(true));
    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
    expect(screen.getByRole('heading', { name: '로그인 페이지' })).toBeInTheDocument();
  });

  test('GET /users/me 에러 → ErrorMessage', async () => {
    mock.reset();
    mock.onGet('/users/me').reply(500, { error: { code: 'X', message: '서버 오류' } });
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('서버 오류'));
  });
});
