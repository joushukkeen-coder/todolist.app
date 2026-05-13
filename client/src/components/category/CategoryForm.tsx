import { useEffect, useState, type FormEvent } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ErrorMessage from '@/components/common/ErrorMessage';
import type { Category, CategoryCreateRequest } from '@/types/category.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: Category | null;
  onSubmit: (payload: CategoryCreateRequest) => void;
  isSubmitting: boolean;
  error?: unknown;
}

const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export default function CategoryForm({
  isOpen,
  onClose,
  initial,
  onSubmit,
  isSubmitting,
  error,
}: Props) {
  const [name, setName] = useState('');
  const [colorCode, setColorCode] = useState('#4A90D9');
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [colorErr, setColorErr] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? '');
      setColorCode(initial?.colorCode ?? '#4A90D9');
      setNameErr(null);
      setColorErr(null);
    }
  }, [isOpen, initial]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setNameErr('이름을 입력해 주세요');
      return;
    }
    if (n.length > 200) {
      setNameErr('이름은 200자 이하여야 합니다');
      return;
    }
    if (!COLOR_REGEX.test(colorCode)) {
      setColorErr('#RRGGBB 형식이어야 합니다');
      return;
    }
    onSubmit({ name: n, colorCode });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? '카테고리 수정' : '카테고리 생성'}>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameErr}
        />
        <Input
          label="색상 코드 (#RRGGBB)"
          value={colorCode}
          onChange={(e) => setColorCode(e.target.value)}
          error={colorErr}
        />
        {error ? <ErrorMessage error={error as Error} /> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initial ? '수정' : '생성'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
