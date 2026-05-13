const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');

const A_EMAIL = 'be09-a@example.com';
const B_EMAIL = 'be09-b@example.com';
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

  let r = await request(app).get('/api/v1/categories');
  check('인증 누락 GET → 401', r.status === 401);

  r = await request(app).get('/api/v1/categories').set('Authorization', tokenA);
  check('GET 200 + 기본 카테고리 3개 포함', r.status === 200 && r.body.categories.filter(c => c.isDefault).length === 3);
  check('카테고리가 camelCase(categoryId/colorCode/isDefault)로 직렬화', r.body.categories.every(c => 'categoryId' in c && 'colorCode' in c && 'isDefault' in c));

  r = await request(app).post('/api/v1/categories').set('Authorization', tokenA)
    .send({ name: 'A전용카테고리', colorCode: '#A1B2C3' });
  check('POST 정상 201', r.status === 201 && r.body.name === 'A전용카테고리');
  const aCatId = r.body.categoryId;

  r = await request(app).post('/api/v1/categories').set('Authorization', tokenA)
    .send({ name: 'A전용카테고리', colorCode: '#FFFFFF' });
  check('동일 이름 중복 → 409 CATEGORY_NAME_DUPLICATE', r.status === 409 && r.body.error.code === 'CATEGORY_NAME_DUPLICATE');

  r = await request(app).post('/api/v1/categories').set('Authorization', tokenA)
    .send({ name: 'invalidcolor', colorCode: 'red' });
  check('colorCode 형식 오류 → 400 VALIDATION_ERROR', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  // B 사용자도 동일 이름 사용 가능 (사용자별 유니크)
  r = await request(app).post('/api/v1/categories').set('Authorization', tokenB)
    .send({ name: 'A전용카테고리', colorCode: '#222222' });
  check('타 사용자는 동일 이름 사용 가능 → 201', r.status === 201);

  // B는 A의 카테고리를 보지 못함
  r = await request(app).get('/api/v1/categories').set('Authorization', tokenB);
  const bSees = r.body.categories.some(c => c.categoryId === aCatId);
  check('타 사용자(B)의 GET 결과에 A의 카테고리 미포함', !bSees);
  check('B의 GET 결과에 본인 소유 카테고리 + 기본 3개만 포함', r.body.categories.every(c => c.isDefault || c.userId !== null));

  await userRepository.deleteByEmail(A_EMAIL);
  await userRepository.deleteByEmail(B_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
