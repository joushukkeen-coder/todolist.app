const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');

const A_EMAIL = 'be13-a@example.com';
const B_EMAIL = 'be13-b@example.com';
const PASSWORD = 'password1';

async function register(email, name) {
  await userRepository.deleteByEmail(email);
  await request(app).post('/api/v1/auth/register').send({ email, password: PASSWORD, name });
  const login = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return `Bearer ${login.body.accessToken}`;
}

(async () => {
  let pass = 0, fail = 0;
  const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}`); cond ? pass++ : fail++; };

  const tokenA = await register(A_EMAIL, 'A');
  const tokenB = await register(B_EMAIL, 'B');

  const cats = await request(app).get('/api/v1/categories').set('Authorization', tokenA);
  const defaultCatId = cats.body.categories.find(c => c.isDefault).categoryId;

  const created = await request(app).post('/api/v1/todos').set('Authorization', tokenA)
    .send({ title: 'todo-13', categoryId: defaultCatId });
  const todoId = created.body.todoId;

  let r;

  // === complete ===
  r = await request(app).patch(`/api/v1/todos/${todoId}/complete`);
  check('complete 인증 누락 → 401', r.status === 401);

  r = await request(app).patch(`/api/v1/todos/${todoId}/complete`).set('Authorization', tokenB);
  check('complete 타인 → 403 FORBIDDEN', r.status === 403 && r.body.error.code === 'FORBIDDEN');

  r = await request(app).patch(`/api/v1/todos/${todoId}/complete`).set('Authorization', tokenA);
  check('complete 정상 → 200', r.status === 200);
  check('is_completed=true, completed_at!=null', r.body.isCompleted === true && r.body.completedAt !== null);

  r = await request(app).patch(`/api/v1/todos/${todoId}/complete`).set('Authorization', tokenA);
  check('이미 완료 → 409 TODO_ALREADY_COMPLETED', r.status === 409 && r.body.error.code === 'TODO_ALREADY_COMPLETED');

  // === reopen ===
  r = await request(app).patch(`/api/v1/todos/${todoId}/reopen`);
  check('reopen 인증 누락 → 401', r.status === 401);

  r = await request(app).patch(`/api/v1/todos/${todoId}/reopen`).set('Authorization', tokenB);
  check('reopen 타인 → 403 FORBIDDEN', r.status === 403 && r.body.error.code === 'FORBIDDEN');

  r = await request(app).patch(`/api/v1/todos/${todoId}/reopen`).set('Authorization', tokenA);
  check('reopen 정상 → 200', r.status === 200);
  check('is_completed=false, completed_at=null', r.body.isCompleted === false && r.body.completedAt === null);

  r = await request(app).patch(`/api/v1/todos/${todoId}/reopen`).set('Authorization', tokenA);
  check('이미 미완료 → 409 TODO_NOT_COMPLETED', r.status === 409 && r.body.error.code === 'TODO_NOT_COMPLETED');

  // 존재하지 않는 todoId
  r = await request(app).patch('/api/v1/todos/00000000-0000-0000-0000-000000000000/complete').set('Authorization', tokenA);
  check('미존재 todoId /complete → 404 TODO_NOT_FOUND', r.status === 404 && r.body.error.code === 'TODO_NOT_FOUND');

  await userRepository.deleteByEmail(A_EMAIL);
  await userRepository.deleteByEmail(B_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
