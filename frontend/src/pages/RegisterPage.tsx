import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useRegister } from '@/hooks/useAuth';
import { validateEmail, validatePassword, validateName } from '@/utils/validators';
import { ROUTES } from '@/router/paths';
import './AuthPages.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);

  const register = useRegister();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const nErr = validateName(name);
    setEmailErr(eErr);
    setPwErr(pErr);
    setNameErr(nErr);
    if (eErr || pErr || nErr) return;
    register.mutate(
      { email, password, name: name.trim() },
      { onSuccess: () => navigate(ROUTES.LOGIN, { replace: true }) },
    );
  };

  return (
    <section className="auth-page">
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit} noValidate className="auth-page__form">
        <Input
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailErr}
          autoComplete="email"
        />
        <Input
          label="비밀번호 (8자 이상)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={pwErr}
          autoComplete="new-password"
        />
        <Input
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameErr}
        />
        {register.isError && <ErrorMessage error={register.error} />}
        <Button type="submit" isLoading={register.isPending}>
          회원가입
        </Button>
      </form>
      <p className="auth-page__link">
        이미 계정이 있으신가요? <Link to={ROUTES.LOGIN}>로그인</Link>
      </p>
    </section>
  );
}
