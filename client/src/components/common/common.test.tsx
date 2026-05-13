import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';

describe('Button', () => {
  test('기본 렌더 + variant/size 클래스 적용', () => {
    render(
      <Button variant="danger" size="lg">
        삭제
      </Button>,
    );
    const btn = screen.getByRole('button', { name: '삭제' });
    expect(btn).toHaveClass('btn--danger');
    expect(btn).toHaveClass('btn--lg');
    expect(btn).not.toBeDisabled();
  });

  test('disabled prop → 비활성화', () => {
    render(<Button disabled>x</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('isLoading → Spinner 표시 + 비활성화 + aria-busy', () => {
    render(<Button isLoading>저장</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('isLoading 시 onClick 호출 안 됨', () => {
    const handler = vi.fn();
    render(
      <Button isLoading onClick={handler}>
        저장
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });

  test('정상 onClick 호출', () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>저장</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalled();
  });
});

describe('Input', () => {
  test('label 표시 + onChange 호출', () => {
    const onChange = vi.fn();
    render(<Input label="이메일" value="" onChange={onChange} />);
    const input = screen.getByLabelText('이메일');
    fireEvent.change(input, { target: { value: 'a@b.com' } });
    expect(onChange).toHaveBeenCalled();
  });

  test('error 전달 시 에러 메시지·aria-invalid·role=alert 표시', () => {
    render(<Input label="이메일" value="" onChange={() => {}} error="형식 오류" />);
    const input = screen.getByLabelText('이메일');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('형식 오류');
  });

  test('error 없음 → aria-invalid 없음, alert 없음', () => {
    render(<Input label="이메일" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('이메일')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Modal', () => {
  test('isOpen=false → 렌더 안 됨', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="t">
        body
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('isOpen=true → dialog/aria-modal/title/body 표시', () => {
    render(
      <Modal isOpen onClose={() => {}} title="확인">
        본문
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('확인')).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
  });

  test('오버레이 클릭 시 onClose 호출', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="t">
        body
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  test('컨텐츠 클릭은 onClose 호출 안 함', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="t">
        body
      </Modal>,
    );
    fireEvent.click(screen.getByText('body'));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('ESC 키 누름 → onClose 호출', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="t">
        body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  test('닫기 버튼 클릭 → onClose', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="t">
        body
      </Modal>,
    );
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Spinner', () => {
  test('role=status, size 클래스', () => {
    render(<Spinner size="lg" />);
    const sp = screen.getByRole('status');
    expect(sp).toHaveClass('spinner--lg');
    expect(sp).toHaveAttribute('aria-label', '로딩 중');
  });
});

describe('ErrorMessage', () => {
  test('null → 렌더 없음', () => {
    const { container } = render(<ErrorMessage error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('string → role=alert + 메시지', () => {
    render(<ErrorMessage error="에러발생" />);
    expect(screen.getByRole('alert')).toHaveTextContent('에러발생');
  });

  test('Error 인스턴스 → message 표시', () => {
    render(<ErrorMessage error={new Error('boom')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
  });

  test('AxiosError 형태 → response.data.error.message 추출', () => {
    const axiosLike = { response: { data: { error: { code: 'X', message: '서버오류' } } } };
    render(<ErrorMessage error={axiosLike as never} />);
    expect(screen.getByRole('alert')).toHaveTextContent('서버오류');
  });
});
