const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');

const A_EMAIL = 'be11-a@example.com';
const B_EMAIL = 'be11-b@example.com';
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

  const listA = await request(app).get('/api/v1/categories').set('Authorization', tokenA);
  const defaultCatId = listA.body.categories.find(c => c.isDefault).categoryId;

  const bCat = await request(app).post('/api/v1/categories').set('Authorization', tokenB)
    .send({ name: 'B-cat', colorCode: '#BBBBBB' });
  const bCatId = bCat.body.categoryId;

  let r;

  r = await request(app).post('/api/v1/todos');
  check('POST 인증 누락 → 401', r.status === 401);

  r = await request(app).post('/api/v1/todos').set('Authorization', tokenA)
    .send({ title: '첫 할일', categoryId: defaultCatId });
  check('POST 정상 → 201', r.status === 201 && r.body.title === '첫 할일');
  check('초기 is_completed=false, completed_at=null', r.body.isCompleted === false && r.body.completedAt === null);
  check('todo 응답 camelCase (todoId/categoryId/dueDate)', 'todoId' in r.body && 'categoryId' in r.body && 'dueDate' in r.body);

  r = await request(app).post('/api/v1/todos').set('Authorization', tokenA)
    .send({ categoryId: defaultCatId });
  check('title 누락 → 400 VALIDATION_ERROR', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await request(app).post('/api/v1/todos').set('Authorization', tokenA)
    .send({ title: '', categoryId: defaultCatId });
  check('title 빈 문자열 → 400', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await request(app).post('/api/v1/todos').set('Authorization', tokenA)
    .send({ title: 'x'.repeat(201), categoryId: defaultCatId });
  check('title 200자 초과 → 400', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await request(app).post('/api/v1/todos').set('Authorization', tokenA)
    .send({ title: '카테고리누락' });
  check('categoryId 누락 → 400', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await request(app).post('/api/v1/todos').set('Authorization', tokenA)
    .send({ title: '없는카테고리', categoryId: '00000000-0000-0000-0000-000000000000' });
  check('존재하지 않는 categoryId → 404 CATEGORY_NOT_FOUND', r.status === 404 && r.body.error.code === 'CATEGORY_NOT_FOUND');

  r = await request(app).post('/api/v1/todos').set('Authorization', tokenA)
    .send({ title: '타인카테고리', categoryId: bCatId });
  check('타 사용자 categoryId → 404 CATEGORY_NOT_FOUND', r.status === 404 && r.body.error.code === 'CATEGORY_NOT_FOUND');

  // 정렬 검증: 3건 추가 (인위적으로 시간차)
  await request(app).post('/api/v1/todos').set('Authorization', tokenA).send({ title: '두번째', categoryId: defaultCatId });
  await new Promise(r => setTimeout(r, 50));
  await request(app).post('/api/v1/todos').set('Authorization', tokenA).send({ title: '세번째', categoryId: defaultCatId });

  r = await request(app).get('/api/v1/todos');
  check('GET 인증 누락 → 401', r.status === 401);

  r = await request(app).get('/api/v1/todos').set('Authorization', tokenA);
  check('GET 200', r.status === 200);
  check('본인 todos 3건만', r.body.todos.length === 3);
  const titles = r.body.todos.map(t => t.title);
  check('created_at DESC 정렬 (세번째 → 두번째 → 첫 할일)', titles[0] === '세번째' && titles[2] === '첫 할일');

  // B는 A의 todo를 못 봄
  r = await request(app).get('/api/v1/todos').set('Authorization', tokenB);
  check('타 사용자 GET 결과에 A의 todos 미포함', r.body.todos.length === 0);

  await userRepository.deleteByEmail(A_EMAIL);
  await userRepository.deleteByEmail(B_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
