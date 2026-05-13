import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Spinner from '@/components/common/Spinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useDeleteAccount, useMe, useUpdateProfile } from '@/hooks/useUser';
import { validatePassword } from '@/utils/validators';
import { ROUTES } from '@/router/paths';

export default function ProfilePage() {
  const navigate = useNavigate();
  const meQuery = useMe();
  const update = useUpdateProfile();
  const remove = useDeleteAccount();

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (meQuery.data) setName(meQuery.data.name);
  }, [meQuery.data]);

  if (meQuery.isLoading) return <Spinner size="lg" />;
  if (meQuery.isError || !meQuery.data) return <ErrorMessage error={meQuery.error} />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPwErr(null);

    const payload: { name?: string; currentPassword?: string; newPassword?: string } = {};
    if (name !== meQuery.data?.name) payload.name = name;
    if (newPassword) {
      const err = validatePassword(newPassword);
      if (err) {
        setPwErr(err);
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    if (Object.keys(payload).length === 0) return;
    update.mutate(payload, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
      },
    });
  };

  const handleDelete = () => {
    remove.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        navigate(ROUTES.LOGIN, { replace: true });
      },
    });
  };

  return (
    <section style={{ maxWidth: 480 }}>
      <h1>프로필</h1>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="이메일"
          type="email"
          value={meQuery.data.email}
          disabled
          onChange={() => {}}
        />
        <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="현재 비밀번호"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Input
          label="새 비밀번호"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={pwErr}
          autoComplete="new-password"
        />
        {update.isError && <ErrorMessage error={update.error} />}
        <Button type="submit" isLoading={update.isPending}>
          저장
        </Button>
      </form>

      <hr style={{ margin: '32px 0' }} />

      <div>
        <h2 style={{ fontSize: 16 }}>회원 탈퇴</h2>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          회원 탈퇴
        </Button>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="회원 탈퇴 확인">
        <p>탈퇴 시 모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?</p>
        {remove.isError && <ErrorMessage error={remove.error} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            취소
          </Button>
          <Button variant="danger" isLoading={remove.isPending} onClick={handleDelete}>
            탈퇴하기
          </Button>
        </div>
      </Modal>
    </section>
  );
}
