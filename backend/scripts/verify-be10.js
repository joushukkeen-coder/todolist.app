const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');

const A_EMAIL = 'be10-a@example.com';
const B_EMAIL = 'be10-b@example.com';
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

  // A가 카테고리 2개 생성
  const c1 = await request(app).post('/api/v1/categories').set('Authorization', tokenA)
    .send({ name: 'A-cat1', colorCode: '#111111' });
  const c2 = await request(app).post('/api/v1/categories').set('Authorization', tokenA)
    .send({ name: 'A-cat2', colorCode: '#222222' });
  const aCat1Id = c1.body.categoryId;
  const aCat2Id = c2.body.categoryId;

  // 기본 카테고리 id 1개 확보
  const list = await request(app).get('/api/v1/categories').set('Authorization', tokenA);
  const defaultCatId = list.body.categories.find(c => c.isDefault).categoryId;

  let r;

  // === PATCH ===
  r = await request(app).patch(`/api/v1/categories/${aCat1Id}`);
  check('PATCH 인증 누락 → 401', r.status === 401);

  r = await request(app).patch(`/api/v1/categories/${aCat1Id}`).set('Authorization', tokenA)
    .send({ name: 'A-cat1-renamed', colorCode: '#333333' });
  check('PATCH 정상 → 200', r.status === 200 && r.body.name === 'A-cat1-renamed' && r.body.colorCode === '#333333');

  r = await request(app).patch(`/api/v1/categories/${defaultCatId}`).set('Authorization', tokenA)
    .send({ name: '기본수정시도' });
  check('PATCH 기본 카테고리 → 403 DEFAULT_CATEGORY_IMMUTABLE', r.status === 403 && r.body.error.code === 'DEFAULT_CATEGORY_IMMUTABLE');

  r = await request(app).patch(`/api/v1/categories/${aCat1Id}`).set('Authorization', tokenB)
    .send({ name: '타인수정시도' });
  check('PATCH 타인 카테고리 → 403 FORBIDDEN', r.status === 403 && r.body.error.code === 'FORBIDDEN');

  r = await request(app).patch(`/api/v1/categories/${aCat2Id}`).set('Authorization', tokenA)
    .send({ name: 'A-cat1-renamed' });
  check('PATCH 이름 중복 → 409 CATEGORY_NAME_DUPLICATE', r.status === 409 && r.body.error.code === 'CATEGORY_NAME_DUPLICATE');

  r = await request(app).patch('/api/v1/categories/not-uuid').set('Authorization', tokenA)
    .send({ name: 'x' });
  check('PATCH 잘못된 uuid → 400 VALIDATION_ERROR', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  // === DELETE ===
  r = await request(app).delete(`/api/v1/categories/${aCat2Id}`).set('Authorization', tokenA);
  check('DELETE 정상 → 204', r.status === 204);

  r = await request(app).delete(`/api/v1/categories/${defaultCatId}`).set('Authorization', tokenA);
  check('DELETE 기본 카테고리 → 403 DEFAULT_CATEGORY_IMMUTABLE', r.status === 403 && r.body.error.code === 'DEFAULT_CATEGORY_IMMUTABLE');

  r = await request(app).delete(`/api/v1/categories/${aCat1Id}`).set('Authorization', tokenB);
  check('DELETE 타인 카테고리 → 403 FORBIDDEN', r.status === 403 && r.body.error.code === 'FORBIDDEN');

  // 연결된 todos가 있는 카테고리 삭제 시도 → 409
  const userA = await userRepository.findByEmail(A_EMAIL);
  await pool.query('INSERT INTO todos (user_id, category_id, title) VALUES ($1, $2, $3)', [userA.userId, aCat1Id, 'blocking-todo']);
  r = await request(app).delete(`/api/v1/categories/${aCat1Id}`).set('Authorization', tokenA);
  check('DELETE 연결된 todos 존재 → 409 CATEGORY_HAS_TODOS', r.status === 409 && r.body.error.code === 'CATEGORY_HAS_TODOS');

  await userRepository.deleteByEmail(A_EMAIL);
  await userRepository.deleteByEmail(B_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
