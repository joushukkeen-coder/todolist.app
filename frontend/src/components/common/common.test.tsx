import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import type { AxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/api.types';

describe('Spinner', () => {
  test('role=status + aria-label=처리 중 (기본)', () => {
    render(<Spinner />);
    const s = screen.getByRole('status');
    expect(s).toHaveAttribute('aria-label', '처리 중');
    expect(s.className).toContain('spinner--md');
  });
  test('size·label props 반영', () => {
    render(<Spinner size="lg" label="로딩" />);
    const s = screen.getByRole('status');
    expect(s.className).toContain('spinner--lg');
    expect(s).toHaveAttribute('aria-label', '로딩');
  });
});

describe('Button', () => {
  test('기본 primary md 렌더', () => {
    render(<Button>저장</Button>);
    const b = screen.getByRole('button', { name: '저장' });
    expect(b.className).toContain('btn--primary');
    expect(b.className).toContain('btn--md');
    expect(b).not.toBeDisabled();
  });
  test('variant·size 적용', () => {
    render(
      <Button variant="danger" size="sm">
        삭제
      </Button>,
    );
    const b = screen.getByRole('button', { name: '삭제' });
    expect(b.className).toContain('btn--danger');
    expect(b.className).toContain('btn--sm');
  });
  test('isLoading → 비활성 + aria-busy + Spinner', () => {
    render(<Button isLoading>제출</Button>);
    const b = screen.getByRole('button', { name: /제출/ });
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute('aria-busy', 'true');
    expect(b.querySelector('.spinner')).toBeInTheDocument();
  });
  test('disabled → aria-disabled, onClick 무효', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        x
      </Button>,
    );
    const b = screen.getByRole('button', { name: 'x' });
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
  });
  test('정상 클릭 시 onClick 호출', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>클릭</Button>);
    fireEvent.click(screen.getByRole('button', { name: '클릭' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Input', () => {
  test('label·input 연결 (htmlFor)', () => {
    render(<Input label="이메일" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('이메일');
    expect(input.tagName).toBe('INPUT');
  });
  test('error 표시 + aria-invalid + role=alert', () => {
    render(<Input label="이메일" value="" onChange={() => {}} error="형식 오류" />);
    const input = screen.getByLabelText('이메일');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('형식 오류');
  });
  test('onChange 호출', () => {
    const onChange = vi.fn();
    render(<Input label="이메일" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Modal', () => {
  test('isOpen=false → 렌더되지 않음', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="t">
        body
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  test('isOpen=true → role=dialog + title + 본문', () => {
    render(
      <Modal isOpen onClose={() => {}} title="확인">
        본문 내용
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('확인')).toBeInTheDocument();
    expect(screen.getByText('본문 내용')).toBeInTheDocument();
  });
  test('오버레이 클릭 → onClose', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="t">
        x
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });
  test('내용 클릭은 onClose 미호출 (전파 중단)', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="t">
        본문
      </Modal>,
    );
    fireEvent.click(screen.getByText('본문'));
    expect(onClose).not.toHaveBeenCalled();
  });
  test('닫기 버튼 클릭 → onClose', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="t">
        x
      </Modal>,
    );
    fireEvent.click(screen.getByLabelText('닫기'));
    expect(onClose).toHaveBeenCalled();
  });
  test('ESC 키 → onClose', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="t">
        x
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ErrorMessage', () => {
  test('null/undefined → 렌더 없음', () => {
    const { container } = render(<ErrorMessage error={null} />);
    expect(container.firstChild).toBeNull();
  });
  test('문자열 메시지 표시', () => {
    render(<ErrorMessage error="오류 발생" />);
    expect(screen.getByRole('alert')).toHaveTextContent('오류 발생');
  });
  test('Error 객체의 message 표시', () => {
    render(<ErrorMessage error={new Error('실패')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('실패');
  });
  test('AxiosError 응답 본문의 error.message 우선', () => {
    const axiosErr = {
      isAxiosError: true,
      response: { data: { error: { code: 'X', message: '서버 오류 메시지' } } },
      message: 'fallback',
    } as unknown as AxiosError<ApiErrorBody>;
    render(<ErrorMessage error={axiosErr} />);
    expect(screen.getByRole('alert')).toHaveTextContent('서버 오류 메시지');
  });
});
