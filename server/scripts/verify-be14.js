const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');

const A_EMAIL = 'be14-a@example.com';
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

  const cats = await request(app).get('/api/v1/categories').set('Authorization', tokenA);
  const defaultCats = cats.body.categories.filter(c => c.isDefault);
  const cat1 = defaultCats[0].categoryId;
  const cat2 = defaultCats[1].categoryId;
  const userA = await userRepository.findByEmail(A_EMAIL);

  // 시드 todos
  // t1: cat1, due=2026-05-01, completed
  // t2: cat1, due=2026-05-15, not completed
  // t3: cat2, due=null,        not completed
  // t4: cat2, due=2026-06-10, completed
  // t5: cat1, due=null,        completed
  const seed = [
    [cat1, 't1', '2026-05-01', true],
    [cat1, 't2', '2026-05-15', false],
    [cat2, 't3', null, false],
    [cat2, 't4', '2026-06-10', true],
    [cat1, 't5', null, true],
  ];
  for (const [catId, title, dueDate, isCompleted] of seed) {
    await pool.query(
      `INSERT INTO todos (user_id, category_id, title, due_date, is_completed, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userA.userId, catId, title, dueDate, isCompleted, isCompleted ? new Date() : null]
    );
  }

  const get = async (qs = '') => {
    const r = await request(app).get(`/api/v1/todos${qs}`).set('Authorization', tokenA);
    return r;
  };
  const titles = (body) => body.todos.map(t => t.title).sort();

  let r;

  r = await get('');
  check('필터 없음 → 전체 5건', r.status === 200 && r.body.todos.length === 5);

  r = await get(`?categoryId=${cat1}`);
  check('categoryId 필터 → t1/t2/t5', JSON.stringify(titles(r.body)) === JSON.stringify(['t1', 't2', 't5']));

  r = await get('?isCompleted=true');
  check('isCompleted=true → t1/t4/t5', JSON.stringify(titles(r.body)) === JSON.stringify(['t1', 't4', 't5']));

  r = await get('?isCompleted=false');
  check('isCompleted=false → t2/t3', JSON.stringify(titles(r.body)) === JSON.stringify(['t2', 't3']));

  r = await get('?dueDateFrom=2026-05-01&dueDateTo=2026-05-31');
  check('기간 필터 5월 → t1/t2 (due_date NULL 제외)', JSON.stringify(titles(r.body)) === JSON.stringify(['t1', 't2']));

  r = await get(`?categoryId=${cat1}&isCompleted=true&dueDateFrom=2026-04-01&dueDateTo=2026-05-31`);
  check('복합 AND (cat1 + 완료 + 5월) → t1만', JSON.stringify(titles(r.body)) === JSON.stringify(['t1']));

  r = await get('?dueDateFrom=2027-01-01');
  check('기간 매칭 없음 → 0건', r.body.todos.length === 0);

  r = await get('?categoryId=not-uuid');
  check('잘못된 categoryId(uuid 위반) → 400', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await get('?isCompleted=maybe');
  check('잘못된 isCompleted → 400', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await get('?dueDateFrom=05-01-2026');
  check('잘못된 dueDateFrom 형식 → 400', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  await userRepository.deleteByEmail(A_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
