const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');

const A_EMAIL = 'be12-a@example.com';
const B_EMAIL = 'be12-b@example.com';
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

  // A의 todo 생성
  const created = await request(app).post('/api/v1/todos').set('Authorization', tokenA)
    .send({ title: '원본', categoryId: defaultCatId });
  const todoId = created.body.todoId;
  const originalUpdatedAt = created.body.updatedAt;

  let r;

  // === PATCH ===
  r = await request(app).patch(`/api/v1/todos/${todoId}`);
  check('PATCH 인증 누락 → 401', r.status === 401);

  await new Promise(r => setTimeout(r, 1100));
  r = await request(app).patch(`/api/v1/todos/${todoId}`).set('Authorization', tokenA)
    .send({ title: '수정됨', description: '설명추가' });
  check('PATCH 정상 → 200', r.status === 200 && r.body.title === '수정됨' && r.body.description === '설명추가');
  check('updated_at 자동 갱신 (트리거)', new Date(r.body.updatedAt) > new Date(originalUpdatedAt));

  r = await request(app).patch(`/api/v1/todos/${todoId}`).set('Authorization', tokenA)
    .send({ description: '설명만수정' });
  check('변경 필드만 UPDATE - title 보존', r.status === 200 && r.body.title === '수정됨' && r.body.description === '설명만수정');

  r = await request(app).patch('/api/v1/todos/00000000-0000-0000-0000-000000000000').set('Authorization', tokenA)
    .send({ title: '없는' });
  check('존재하지 않는 todoId → 404 TODO_NOT_FOUND', r.status === 404 && r.body.error.code === 'TODO_NOT_FOUND');

  r = await request(app).patch(`/api/v1/todos/${todoId}`).set('Authorization', tokenB)
    .send({ title: '타인수정' });
  check('타인 todo PATCH → 403 FORBIDDEN', r.status === 403 && r.body.error.code === 'FORBIDDEN');

  r = await request(app).patch(`/api/v1/todos/${todoId}`).set('Authorization', tokenA)
    .send({ title: 'x'.repeat(201) });
  check('title 200자 초과 → 400 VALIDATION_ERROR', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await request(app).patch('/api/v1/todos/not-uuid').set('Authorization', tokenA).send({});
  check('잘못된 uuid 파라미터 → 400', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  // === DELETE ===
  r = await request(app).delete(`/api/v1/todos/${todoId}`);
  check('DELETE 인증 누락 → 401', r.status === 401);

  r = await request(app).delete(`/api/v1/todos/${todoId}`).set('Authorization', tokenB);
  check('타인 todo DELETE → 403 FORBIDDEN', r.status === 403 && r.body.error.code === 'FORBIDDEN');

  r = await request(app).delete(`/api/v1/todos/${todoId}`).set('Authorization', tokenA);
  check('DELETE 정상 → 204', r.status === 204);

  const check2 = await pool.query('SELECT COUNT(*)::int AS cnt FROM todos WHERE todo_id = $1', [todoId]);
  check('영구 삭제 (DB 행 0)', check2.rows[0].cnt === 0);

  r = await request(app).delete(`/api/v1/todos/${todoId}`).set('Authorization', tokenA);
  check('삭제된 todo 재삭제 → 404 TODO_NOT_FOUND', r.status === 404 && r.body.error.code === 'TODO_NOT_FOUND');

  await userRepository.deleteByEmail(A_EMAIL);
  await userRepository.deleteByEmail(B_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
