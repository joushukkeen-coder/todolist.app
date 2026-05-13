import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useRegister } from '@/hooks/useAuth';
import { validateEmail, validateName, validatePassword } from '@/utils/validators';
import { ROUTES } from '@/router/paths';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const register = useRegister();

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
      { email, password, name },
      { onSuccess: () => navigate(ROUTES.LOGIN, { replace: true }) },
    );
  };

  return (
    <section style={{ maxWidth: 360, margin: '60px auto', padding: 24 }}>
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit} noValidate>
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
          autoComplete="new-password"
        />
        <Input
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameErr}
        />
        {register.isError && <ErrorMessage error={register.error} />}
        <Button type="submit" isLoading={register.isPending} size="lg">
          회원가입
        </Button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        이미 계정이 있으신가요? <Link to={ROUTES.LOGIN}>로그인</Link>
      </p>
    </section>
  );
}
