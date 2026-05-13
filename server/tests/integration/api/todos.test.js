const request = require('supertest');
const { truncateAll, registerAndLogin, getDefaultCategoryId, app, pool } = require('../../helpers');

beforeEach(async () => { await truncateAll(); });
afterAll(async () => { await pool.end(); });

async function createTodo(bearer, body) {
  return request(app).post('/api/v1/todos').set('Authorization', bearer).send(body);
}

describe('Todos API', () => {
  test('POST 인증 누락 → 401', async () => {
    const r = await request(app).post('/api/v1/todos');
    expect(r.status).toBe(401);
  });

  test('POST 정상 → 201, is_completed=false, completed_at=null', async () => {
    const A = await registerAndLogin();
    const cat = await getDefaultCategoryId(A.bearer);
    const r = await createTodo(A.bearer, { title: 'first', categoryId: cat });
    expect(r.status).toBe(201);
    expect(r.body.isCompleted).toBe(false);
    expect(r.body.completedAt).toBeNull();
  });

  test('title 위반 (누락/빈/201자) → 400', async () => {
    const A = await registerAndLogin();
    const cat = await getDefaultCategoryId(A.bearer);
    for (const body of [{ categoryId: cat }, { title: '', categoryId: cat }, { title: 'x'.repeat(201), categoryId: cat }]) {
      const r = await createTodo(A.bearer, body);
      expect(r.status).toBe(400);
      expect(r.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('categoryId 미존재/타인 → 404 CATEGORY_NOT_FOUND', async () => {
    const A = await registerAndLogin('a@example.com');
    const B = await registerAndLogin('b@example.com');
    const bCat = await request(app).post('/api/v1/categories').set('Authorization', B.bearer).send({ name: 'B-cat', colorCode: '#222222' });
    const r1 = await createTodo(A.bearer, { title: 'x', categoryId: '00000000-0000-0000-0000-000000000000' });
    const r2 = await createTodo(A.bearer, { title: 'x', categoryId: bCat.body.categoryId });
    expect(r1.status).toBe(404);
    expect(r2.status).toBe(404);
  });

  test('GET → 본인 todos만, created_at DESC', async () => {
    const A = await registerAndLogin();
    const cat = await getDefaultCategoryId(A.bearer);
    await createTodo(A.bearer, { title: 't1', categoryId: cat });
    await new Promise(r => setTimeout(r, 30));
    await createTodo(A.bearer, { title: 't2', categoryId: cat });
    const r = await request(app).get('/api/v1/todos').set('Authorization', A.bearer);
    expect(r.body.todos.map(t => t.title)).toEqual(['t2', 't1']);
  });

  test('PATCH 타인 todo → 403 FORBIDDEN', async () => {
    const A = await registerAndLogin('a@example.com');
    const B = await registerAndLogin('b@example.com');
    const cat = await getDefaultCategoryId(A.bearer);
    const t = await createTodo(A.bearer, { title: 'A-todo', categoryId: cat });
    const r = await request(app).patch(`/api/v1/todos/${t.body.todoId}`).set('Authorization', B.bearer).send({ title: 'haxxor' });
    expect(r.status).toBe(403);
  });

  test('PATCH 미존재 → 404 TODO_NOT_FOUND', async () => {
    const A = await registerAndLogin();
    const r = await request(app).patch('/api/v1/todos/00000000-0000-0000-0000-000000000000').set('Authorization', A.bearer).send({ title: 'x' });
    expect(r.status).toBe(404);
  });

  test('complete/reopen 정상 흐름 + 중복 변경 방지 (409)', async () => {
    const A = await registerAndLogin();
    const cat = await getDefaultCategoryId(A.bearer);
    const t = await createTodo(A.bearer, { title: 'state', categoryId: cat });
    const id = t.body.todoId;

    let r = await request(app).patch(`/api/v1/todos/${id}/complete`).set('Authorization', A.bearer);
    expect(r.status).toBe(200);
    expect(r.body.isCompleted).toBe(true);

    r = await request(app).patch(`/api/v1/todos/${id}/complete`).set('Authorization', A.bearer);
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('TODO_ALREADY_COMPLETED');

    r = await request(app).patch(`/api/v1/todos/${id}/reopen`).set('Authorization', A.bearer);
    expect(r.status).toBe(200);
    expect(r.body.isCompleted).toBe(false);
    expect(r.body.completedAt).toBeNull();

    r = await request(app).patch(`/api/v1/todos/${id}/reopen`).set('Authorization', A.bearer);
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('TODO_NOT_COMPLETED');
  });

  test('DELETE 정상 → 204, 영구 삭제', async () => {
    const A = await registerAndLogin();
    const cat = await getDefaultCategoryId(A.bearer);
    const t = await createTodo(A.bearer, { title: 'd', categoryId: cat });
    const r = await request(app).delete(`/api/v1/todos/${t.body.todoId}`).set('Authorization', A.bearer);
    expect(r.status).toBe(204);
    const re = await request(app).delete(`/api/v1/todos/${t.body.todoId}`).set('Authorization', A.bearer);
    expect(re.status).toBe(404);
  });

  test('필터: 기간 필터는 due_date NULL 제외 (BR-F-02)', async () => {
    const A = await registerAndLogin();
    const cat = await getDefaultCategoryId(A.bearer);
    await createTodo(A.bearer, { title: 'with-date', categoryId: cat });
    const userId = (await pool.query("SELECT user_id FROM users WHERE email='user@example.com'")).rows[0].user_id;
    await pool.query("UPDATE todos SET due_date='2026-05-15' WHERE title='with-date'");
    await pool.query("INSERT INTO todos (user_id, category_id, title) VALUES ($1, $2, 'no-date')", [userId, cat]);

    const all = await request(app).get('/api/v1/todos').set('Authorization', A.bearer);
    expect(all.body.todos.length).toBe(2);

    const filtered = await request(app).get('/api/v1/todos?dueDateFrom=2026-05-01&dueDateTo=2026-05-31').set('Authorization', A.bearer);
    expect(filtered.body.todos.length).toBe(1);
    expect(filtered.body.todos[0].title).toBe('with-date');
  });

  test('필터: 잘못된 쿼리 → 400', async () => {
    const A = await registerAndLogin();
    const r = await request(app).get('/api/v1/todos?isCompleted=maybe').set('Authorization', A.bearer);
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('필터: 복합 AND 조건', async () => {
    const A = await registerAndLogin();
    const cat = await getDefaultCategoryId(A.bearer);
    await createTodo(A.bearer, { title: 't-complete', categoryId: cat });
    await createTodo(A.bearer, { title: 't-open', categoryId: cat });
    const list = await request(app).get('/api/v1/todos').set('Authorization', A.bearer);
    const completeId = list.body.todos.find(t => t.title === 't-complete').todoId;
    await request(app).patch(`/api/v1/todos/${completeId}/complete`).set('Authorization', A.bearer);

    const r = await request(app).get(`/api/v1/todos?categoryId=${cat}&isCompleted=true`).set('Authorization', A.bearer);
    expect(r.body.todos.length).toBe(1);
    expect(r.body.todos[0].title).toBe('t-complete');
  });
});
