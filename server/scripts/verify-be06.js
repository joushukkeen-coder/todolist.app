const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');
const config = require('../src/config/env');

const TEST_EMAIL = 'be06-test@example.com';
const TEST_PASSWORD = 'password1';

(async () => {
  let pass = 0, fail = 0;
  const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}`); cond ? pass++ : fail++; };

  await userRepository.deleteByEmail(TEST_EMAIL);
  await request(app).post('/api/v1/auth/register')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: '로그인테스터' });

  let r = await request(app).post('/api/v1/auth/login').send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  check('정상 로그인 → 200', r.status === 200);
  check('응답에 accessToken + user 포함', typeof r.body.accessToken === 'string' && r.body.user && r.body.user.email === TEST_EMAIL);
  check('user 응답에 password_hash 미포함', !('passwordHash' in r.body.user) && !('password_hash' in r.body.user));

  const decoded = jwt.verify(r.body.accessToken, config.jwt.secret);
  check('JWT payload에 userId 포함', !!decoded.userId);
  const ttl = decoded.exp - decoded.iat;
  check(`JWT 유효기간이 JWT_EXPIRES_IN(${config.jwt.expiresIn})과 일치 (3600s)`, ttl === 3600);

  r = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@example.com', password: 'whatever1' });
  check('이메일 미존재 → 401 INVALID_CREDENTIALS', r.status === 401 && r.body.error.code === 'INVALID_CREDENTIALS');

  r = await request(app).post('/api/v1/auth/login').send({ email: TEST_EMAIL, password: 'wrongpassword' });
  check('비밀번호 불일치 → 401 INVALID_CREDENTIALS', r.status === 401 && r.body.error.code === 'INVALID_CREDENTIALS');

  await userRepository.deleteByEmail(TEST_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
