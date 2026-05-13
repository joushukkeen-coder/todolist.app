const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');

const TEST_EMAIL = 'be05-test@example.com';

(async () => {
  let pass = 0, fail = 0;
  const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}`); cond ? pass++ : fail++; };

  await userRepository.deleteByEmail(TEST_EMAIL);

  let r = await request(app).post('/api/v1/auth/register')
    .send({ email: TEST_EMAIL, password: 'password1', name: '테스터' });
  check('정상 회원가입 → 201', r.status === 201);
  check('응답에 userId/email/name/createdAt 포함', r.body.userId && r.body.email === TEST_EMAIL && r.body.name === '테스터' && r.body.createdAt);
  check('응답에 password_hash 미포함', !('passwordHash' in r.body) && !('password_hash' in r.body) && !('password' in r.body));

  const dbUser = await userRepository.findByEmail(TEST_EMAIL);
  check('DB에 bcrypt 해시 저장(평문 미저장)', dbUser.passwordHash && dbUser.passwordHash !== 'password1' && dbUser.passwordHash.startsWith('$2'));
  check('auth_provider=local 저장', dbUser.authProvider === 'local');
  check('user_id가 UUID 형식', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbUser.userId));

  r = await request(app).post('/api/v1/auth/register')
    .send({ email: TEST_EMAIL, password: 'password2', name: '중복' });
  check('이메일 중복 → 409 EMAIL_ALREADY_EXISTS', r.status === 409 && r.body.error.code === 'EMAIL_ALREADY_EXISTS');

  r = await request(app).post('/api/v1/auth/register')
    .send({ email: 'short-pw@example.com', password: 'short', name: 'x' });
  check('비밀번호 8자 미만 → 400 VALIDATION_ERROR', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await request(app).post('/api/v1/auth/register')
    .send({ email: 'invalid', password: 'password1', name: 'x' });
  check('잘못된 이메일 → 400 VALIDATION_ERROR', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  await userRepository.deleteByEmail(TEST_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
