import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useLogin } from '@/hooks/useAuth';
import { validateEmail, validatePassword } from '@/utils/validators';
import { ROUTES } from '@/router/paths';
import './AuthPages.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const login = useLogin();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPwErr(pErr);
    if (eErr || pErr) return;
    login.mutate(
      { email, password },
      { onSuccess: () => navigate(ROUTES.HOME, { replace: true }) },
    );
  };

  return (
    <section className="auth-page">
      <h1>로그인</h1>
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
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={pwErr}
          autoComplete="current-password"
        />
        {login.isError && <ErrorMessage error={login.error} />}
        <Button type="submit" isLoading={login.isPending}>
          로그인
        </Button>
      </form>
      <p className="auth-page__link">
        계정이 없으신가요? <Link to={ROUTES.REGISTER}>회원가입</Link>
      </p>
    </section>
  );
}
