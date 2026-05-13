import { useState } from 'react';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import ErrorMessage from '@/components/common/ErrorMessage';
import CategoryBadge from '@/components/category/CategoryBadge';
import CategoryForm from '@/components/category/CategoryForm';
import { useCategories } from '@/hooks/useCategories';
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategoryMutations';
import type { Category } from '@/types/category.types';

export default function CategoriesPage() {
  const list = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setFormOpen(true);
  };

  const handleSubmit = (payload: { name: string; colorCode: string }) => {
    if (editing) {
      update.mutate(
        { categoryId: editing.categoryId, payload },
        {
          onSuccess: () => setFormOpen(false),
        },
      );
    } else {
      create.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.categoryId, {
      onSuccess: () => setDeleting(null),
    });
  };

  if (list.isLoading) return <Spinner size="lg" />;
  if (list.isError) return <ErrorMessage error={list.error} />;

  const categories = list.data ?? [];
  const defaults = categories.filter((c) => c.isDefault);
  const customs = categories.filter((c) => !c.isDefault);

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>카테고리</h1>
        <Button onClick={openCreate}>+ 새 카테고리</Button>
      </header>

      <h2 style={{ fontSize: 14, color: '#868e96' }}>기본 카테고리</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {defaults.map((c) => (
          <li
            key={c.categoryId}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}
          >
            <CategoryBadge name={c.name} colorCode={c.colorCode} />
            <span style={{ color: '#868e96', fontSize: 12 }}>(기본 - 수정/삭제 불가)</span>
          </li>
        ))}
      </ul>

      <h2 style={{ fontSize: 14, color: '#868e96' }}>내 카테고리</h2>
      {customs.length === 0 ? (
        <p style={{ color: '#868e96' }}>아직 카테고리가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {customs.map((c) => (
            <li
              key={c.categoryId}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}
            >
              <CategoryBadge name={c.name} colorCode={c.colorCode} />
              <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                수정
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleting(c)}>
                삭제
              </Button>
            </li>
          ))}
        </ul>
      )}

      <CategoryForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSubmit={handleSubmit}
        isSubmitting={create.isPending || update.isPending}
        error={editing ? update.error : create.error}
      />

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="카테고리 삭제 확인">
        <p>"{deleting?.name}" 카테고리를 삭제할까요?</p>
        {remove.isError && <ErrorMessage error={remove.error} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            취소
          </Button>
          <Button variant="danger" isLoading={remove.isPending} onClick={handleDelete}>
            삭제
          </Button>
        </div>
      </Modal>
    </section>
  );
}
