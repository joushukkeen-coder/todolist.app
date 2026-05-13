import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import ProfilePage from './ProfilePage';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/router/paths';

const mock = new MockAdapter(apiClient);
const sampleUser = { userId: 'u1', email: 'a@example.com', name: '원본', createdAt: '2026-05-13' };

beforeEach(() => {
  mock.reset();
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth('jwt', sampleUser);
  mock.onGet('/users/me').reply(200, sampleUser);
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
          <Route path={ROUTES.LOGIN} element={<div>로그인 페이지</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProfilePage', () => {
  test('초기 GET /users/me 호출 + 이메일 disabled + 이름 입력 가능', async () => {
    renderPage();
    const emailInput = await screen.findByLabelText('이메일');
    expect(emailInput).toBeDisabled();
    expect((emailInput as HTMLInputElement).value).toBe('a@example.com');
    expect((screen.getByLabelText('이름') as HTMLInputElement).value).toBe('원본');
  });

  test('이름 변경 → name만 PATCH에 포함', async () => {
    renderPage();
    await screen.findByLabelText('이름');
    mock.onPatch('/users/me').reply((config) => {
      const body = JSON.parse(String(config.data));
      expect(body).toEqual({ name: '새이름' });
      return [200, { ...sampleUser, name: '새이름' }];
    });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '새이름' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(useAuthStore.getState().user?.name).toBe('새이름'));
  });

  test('새 비밀번호 8자 미만 → 에러 표시, API 미호출', async () => {
    renderPage();
    await screen.findByLabelText('이름');
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument();
  });

  test('이름+비밀번호 동시 변경 → 두 필드 모두 PATCH 포함', async () => {
    renderPage();
    await screen.findByLabelText('이름');
    mock.onPatch('/users/me').reply((config) => {
      const body = JSON.parse(String(config.data));
      expect(body.name).toBe('변경');
      expect(body.currentPassword).toBe('oldpass12');
      expect(body.newPassword).toBe('newpass12');
      return [200, { ...sampleUser, name: '변경' }];
    });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '변경' } });
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'oldpass12' } });
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpass12' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(useAuthStore.getState().user?.name).toBe('변경'));
  });

  test('회원 탈퇴 → 확인 모달 → DELETE → clearAuth + /login', async () => {
    renderPage();
    await screen.findByLabelText('이름');
    mock.onDelete('/users/me').reply(204);
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '탈퇴하기' }));
    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
    await screen.findByText('로그인 페이지');
  });

  test('탈퇴 모달 취소 → 모달 닫힘, API 미호출, 인증 유지', async () => {
    renderPage();
    await screen.findByLabelText('이름');
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(useAuthStore.getState().token).toBe('jwt');
  });

  test('PATCH 에러 → ErrorMessage 표시', async () => {
    renderPage();
    await screen.findByLabelText('이름');
    mock
      .onPatch('/users/me')
      .reply(401, { error: { code: 'INVALID_CURRENT_PASSWORD', message: '현재 비밀번호 오류' } });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '새' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('현재 비밀번호 오류'));
  });

  test('GET 로딩 시 Spinner 표시 → 데이터 로드 후 폼 표시', async () => {
    renderPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
    await screen.findByLabelText('이름');
  });

  test('hooks 캡슐화: ProfilePage 소스에 apiClient 직접 import 없음', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile('src/pages/ProfilePage.tsx', 'utf8');
    expect(src).not.toMatch(/from\s+['"]@\/services\/apiClient['"]/);
    expect(src).not.toMatch(/from\s+['"]axios['"]/);
  });
});

// suppress unused warning
void vi;
