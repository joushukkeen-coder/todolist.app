import { useEffect, useState, type FormEvent } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ErrorMessage from '@/components/common/ErrorMessage';
import type { Category } from '@/types/category.types';
import type { Todo, TodoCreateRequest, TodoUpdateRequest } from '@/types/todo.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial?: Todo | null;
  categories: Category[];
  onSubmit: (payload: TodoCreateRequest | TodoUpdateRequest) => void;
  isSubmitting: boolean;
  error?: unknown;
}

export default function TodoForm({
  isOpen,
  onClose,
  initial,
  categories,
  onSubmit,
  isSubmitting,
  error,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [titleErr, setTitleErr] = useState<string | null>(null);
  const [categoryErr, setCategoryErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setDueDate(initial?.dueDate ?? '');
    setCategoryId(initial?.categoryId ?? categories[0]?.categoryId ?? '');
    setTitleErr(null);
    setCategoryErr(null);
  }, [isOpen, initial, categories]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setTitleErr('제목을 입력해 주세요');
      return;
    }
    if (t.length > 200) {
      setTitleErr('제목은 200자 이하여야 합니다');
      return;
    }
    if (!categoryId) {
      setCategoryErr('카테고리를 선택해 주세요');
      return;
    }
    const payload: TodoCreateRequest = {
      title: t,
      categoryId,
      description: description.trim() ? description.trim() : null,
      dueDate: dueDate ? dueDate : null,
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial?.todoId ? '할일 수정' : '할일 추가'}>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={titleErr}
          maxLength={250}
        />
        <div className="input-group">
          <label htmlFor="todo-desc" className="input-label">
            설명
          </label>
          <textarea
            id="todo-desc"
            className="input-field"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <Input
          label="종료예정일"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <div className="input-group">
          <label htmlFor="todo-cat" className="input-label">
            카테고리
          </label>
          <select
            id="todo-cat"
            className="input-field"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setCategoryErr(null);
            }}
          >
            <option value="">선택</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
              </option>
            ))}
          </select>
          {categoryErr && (
            <span role="alert" className="input-error">
              {categoryErr}
            </span>
          )}
        </div>
        {error ? <ErrorMessage error={error as Error} /> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initial?.todoId ? '수정' : '등록'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
