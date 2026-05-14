import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Spinner from '@/components/common/Spinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useChangePassword, useDeleteAccount, useMe, useUpdateProfile } from '@/hooks/useUser';
import { validateName, validatePassword } from '@/utils/validators';
import { ROUTES } from '@/router/paths';
import './ProfilePage.css';

export default function ProfilePage() {
  const me = useMe();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [nameErr, setNameErr] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [currentPwErr, setCurrentPwErr] = useState<string | null>(null);
  const [newPwErr, setNewPwErr] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (me.data) setName(me.data.name);
  }, [me.data]);

  const submitName = (e: FormEvent) => {
    e.preventDefault();
    const err = validateName(name);
    setNameErr(err);
    if (err) return;
    updateProfile.mutate({ name: name.trim() });
  };

  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    const cErr = currentPw ? null : '현재 비밀번호를 입력해 주세요';
    const nErr = validatePassword(newPw);
    setCurrentPwErr(cErr);
    setNewPwErr(nErr);
    if (cErr || nErr) return;
    changePassword.mutate(
      { currentPassword: currentPw, newPassword: newPw },
      {
        onSuccess: () => {
          setCurrentPw('');
          setNewPw('');
        },
      },
    );
  };

  const doDelete = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => navigate(ROUTES.LOGIN, { replace: true }),
    });
  };

  if (me.isLoading) return <Spinner size="lg" />;
  if (me.isError) return <ErrorMessage error={me.error} />;
  if (!me.data) return null;

  return (
    <section className="profile-page">
      <h1>프로필</h1>

      <form onSubmit={submitName} noValidate className="profile-page__section">
        <Input label="이메일" type="email" value={me.data.email} disabled readOnly />
        <Input
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameErr}
        />
        {updateProfile.isError && <ErrorMessage error={updateProfile.error} />}
        {updateProfile.isSuccess && <p className="profile-page__ok">이름이 변경되었습니다.</p>}
        <Button type="submit" isLoading={updateProfile.isPending}>
          이름 저장
        </Button>
      </form>

      <hr className="profile-page__divider" />

      <form onSubmit={submitPassword} noValidate className="profile-page__section">
        <h2 className="profile-page__h2">비밀번호 변경</h2>
        <Input
          label="현재 비밀번호"
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          error={currentPwErr}
          autoComplete="current-password"
        />
        <Input
          label="새 비밀번호 (8자 이상)"
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          error={newPwErr}
          autoComplete="new-password"
        />
        {changePassword.isError && <ErrorMessage error={changePassword.error} />}
        {changePassword.isSuccess && <p className="profile-page__ok">비밀번호가 변경되었습니다.</p>}
        <Button type="submit" isLoading={changePassword.isPending}>
          비밀번호 저장
        </Button>
      </form>

      <hr className="profile-page__divider" />

      <div className="profile-page__section">
        <h2 className="profile-page__h2">회원 탈퇴</h2>
        <p className="profile-page__caution">
          탈퇴 시 계정과 모든 데이터(할일·카테고리)가 즉시 영구 삭제되며 복구할 수 없습니다.
        </p>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          회원 탈퇴
        </Button>
      </div>

      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="회원 탈퇴 확인">
        <p>정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        {deleteAccount.isError && <ErrorMessage error={deleteAccount.error} />}
        <div className="profile-page__modal-actions">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            취소
          </Button>
          <Button variant="danger" isLoading={deleteAccount.isPending} onClick={doDelete}>
            탈퇴
          </Button>
        </div>
      </Modal>
    </section>
  );
}
