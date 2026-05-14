const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const userRepository = require('../src/repositories/user.repository');

const A_EMAIL = 'be08-a@example.com';
const B_EMAIL = 'be08-b@example.com';
const PASSWORD = 'password1';

(async () => {
  let pass = 0, fail = 0;
  const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}`); cond ? pass++ : fail++; };

  await userRepository.deleteByEmail(A_EMAIL);
  await userRepository.deleteByEmail(B_EMAIL);

  // 사용자 A: 카테고리·할일 보유
  await request(app).post('/api/v1/auth/register').send({ email: A_EMAIL, password: PASSWORD, name: 'A' });
  const loginA = await request(app).post('/api/v1/auth/login').send({ email: A_EMAIL, password: PASSWORD });
  const tokenA = loginA.body.accessToken;
  const userA = await userRepository.findByEmail(A_EMAIL);

  // 사용자 B: 검증용 (A 탈퇴가 B 데이터에 영향 없는지 확인)
  await request(app).post('/api/v1/auth/register').send({ email: B_EMAIL, password: PASSWORD, name: 'B' });
  const userB = await userRepository.findByEmail(B_EMAIL);

  // A의 카테고리 + 할일 직접 삽입
  const cat = await pool.query(
    `INSERT INTO categories (user_id, name, color_code) VALUES ($1, 'a-cat', '#AAAAAA') RETURNING category_id`,
    [userA.userId]
  );
  await pool.query(
    `INSERT INTO todos (user_id, category_id, title) VALUES ($1, $2, 'a-todo'), ($1, $2, 'a-todo-2')`,
    [userA.userId, cat.rows[0].category_id]
  );

  const beforeA = await pool.query('SELECT (SELECT count(*) FROM todos WHERE user_id=$1) AS todos, (SELECT count(*) FROM categories WHERE user_id=$1) AS cats', [userA.userId]);
  check('탈퇴 전 A의 todos=2, categories=1', beforeA.rows[0].todos === '2' && beforeA.rows[0].cats === '1');

  // 인증 누락
  let r = await request(app).delete('/api/v1/users/me');
  check('인증 누락 → 401', r.status === 401);

  // 정상 탈퇴
  r = await request(app).delete('/api/v1/users/me').set('Authorization', `Bearer ${tokenA}`);
  check('정상 탈퇴 → 204 No Content', r.status === 204 && (r.body === undefined || Object.keys(r.body || {}).length === 0));

  const afterA = await pool.query('SELECT (SELECT count(*) FROM users WHERE user_id=$1) AS u, (SELECT count(*) FROM todos WHERE user_id=$1) AS t, (SELECT count(*) FROM categories WHERE user_id=$1) AS c', [userA.userId]);
  check('A의 users/todos/categories 모두 0 (CASCADE 영구 삭제)', afterA.rows[0].u === '0' && afterA.rows[0].t === '0' && afterA.rows[0].c === '0');

  // 동일 JWT 재요청 → 401 또는 404
  r = await request(app).patch('/api/v1/users/me').set('Authorization', `Bearer ${tokenA}`).send({ name: 'x' });
  check('탈퇴 후 동일 JWT 재요청 → 401 또는 404', r.status === 401 || r.status === 404);

  r = await request(app).delete('/api/v1/users/me').set('Authorization', `Bearer ${tokenA}`);
  check('탈퇴 후 동일 JWT 재탈퇴 → 401 또는 404', r.status === 401 || r.status === 404);

  // B는 영향 없음
  const userBStill = await userRepository.findById(userB.userId);
  check('타 사용자 B 데이터는 영향 없음', !!userBStill);

  await userRepository.deleteByEmail(B_EMAIL);
  await pool.end();
  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
