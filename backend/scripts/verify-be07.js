const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');
const { comparePassword } = require('../src/utils/hash');

const TEST_EMAIL = 'be07-test@example.com';
const TEST_PASSWORD = 'password1';

(async () => {
  let pass = 0, fail = 0;
  const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}`); cond ? pass++ : fail++; };

  await userRepository.deleteByEmail(TEST_EMAIL);
  await request(app).post('/api/v1/auth/register')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: '원본이름' });
  const login = await request(app).post('/api/v1/auth/login')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  const token = login.body.accessToken;
  const bearer = `Bearer ${token}`;

  let r = await request(app).patch('/api/v1/users/me');
  check('인증 누락 → 401', r.status === 401);

  r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer)
    .send({ name: '변경된이름' });
  check('이름만 변경 → 200', r.status === 200 && r.body.name === '변경된이름');
  check('응답에 password_hash 미포함', !('passwordHash' in r.body) && !('password_hash' in r.body));

  r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer)
    .send({ email: 'new@example.com' });
  check('이메일 변경 시도 → 400 EMAIL_CHANGE_NOT_ALLOWED', r.status === 400 && r.body.error.code === 'EMAIL_CHANGE_NOT_ALLOWED');

  r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer)
    .send({ currentPassword: 'wrongwrong', newPassword: 'newpassword1' });
  check('잘못된 currentPassword → 401 INVALID_CURRENT_PASSWORD', r.status === 401 && r.body.error.code === 'INVALID_CURRENT_PASSWORD');

  r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer)
    .send({ currentPassword: TEST_PASSWORD, newPassword: 'short' });
  check('newPassword 8자 미만 → 400 VALIDATION_ERROR', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer)
    .send({ name: '복합변경', currentPassword: TEST_PASSWORD, newPassword: 'newpassword1' });
  check('이름+비밀번호 동시 변경 → 200', r.status === 200 && r.body.name === '복합변경');

  const dbUser = await userRepository.findByEmail(TEST_EMAIL);
  check('DB의 비밀번호가 새 해시로 갱신', await comparePassword('newpassword1', dbUser.passwordHash));
  check('updated_at 갱신됨(트리거)', new Date(dbUser.updatedAt) > new Date(dbUser.createdAt));

  r = await request(app).post('/api/v1/auth/login')
    .send({ email: TEST_EMAIL, password: 'newpassword1' });
  check('새 비밀번호로 로그인 성공', r.status === 200);

  await userRepository.deleteByEmail(TEST_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
