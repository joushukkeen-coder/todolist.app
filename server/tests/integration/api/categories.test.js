const request = require('supertest');
const { truncateAll, registerAndLogin, app, pool } = require('../../helpers');

beforeEach(async () => { await truncateAll(); });
afterAll(async () => { await pool.end(); });

describe('Categories API', () => {
  test('GET 인증 누락 → 401', async () => {
    const r = await request(app).get('/api/v1/categories');
    expect(r.status).toBe(401);
  });

  test('GET → 기본 3개 + 본인 소유만', async () => {
    const A = await registerAndLogin('a@example.com', 'password1', 'A');
    const B = await registerAndLogin('b@example.com', 'password1', 'B');
    await request(app).post('/api/v1/categories').set('Authorization', A.bearer)
      .send({ name: 'A-cat', colorCode: '#111111' });
    const r = await request(app).get('/api/v1/categories').set('Authorization', B.bearer);
    expect(r.status).toBe(200);
    expect(r.body.categories.filter(c => c.isDefault).length).toBe(3);
    expect(r.body.categories.some(c => c.name === 'A-cat')).toBe(false);
  });

  test('POST 동일 이름 중복 → 409 CATEGORY_NAME_DUPLICATE', async () => {
    const A = await registerAndLogin();
    await request(app).post('/api/v1/categories').set('Authorization', A.bearer).send({ name: 'dup', colorCode: '#111111' });
    const r = await request(app).post('/api/v1/categories').set('Authorization', A.bearer).send({ name: 'dup', colorCode: '#222222' });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('CATEGORY_NAME_DUPLICATE');
  });

  test('POST colorCode 형식 오류 → 400 VALIDATION_ERROR', async () => {
    const A = await registerAndLogin();
    const r = await request(app).post('/api/v1/categories').set('Authorization', A.bearer).send({ name: 'x', colorCode: 'red' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('PATCH 기본 카테고리 → 403 DEFAULT_CATEGORY_IMMUTABLE', async () => {
    const A = await registerAndLogin();
    const list = await request(app).get('/api/v1/categories').set('Authorization', A.bearer);
    const def = list.body.categories.find(c => c.isDefault).categoryId;
    const r = await request(app).patch(`/api/v1/categories/${def}`).set('Authorization', A.bearer).send({ name: 'x' });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('DEFAULT_CATEGORY_IMMUTABLE');
  });

  test('PATCH 타인 카테고리 → 403 FORBIDDEN', async () => {
    const A = await registerAndLogin('a@example.com');
    const B = await registerAndLogin('b@example.com');
    const c = await request(app).post('/api/v1/categories').set('Authorization', A.bearer).send({ name: 'A-cat', colorCode: '#111111' });
    const r = await request(app).patch(`/api/v1/categories/${c.body.categoryId}`).set('Authorization', B.bearer).send({ name: 'haxxor' });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('FORBIDDEN');
  });

  test('DELETE 연결된 todos 존재 → 409 CATEGORY_HAS_TODOS', async () => {
    const A = await registerAndLogin();
    const c = await request(app).post('/api/v1/categories').set('Authorization', A.bearer).send({ name: 'with-todo', colorCode: '#111111' });
    await request(app).post('/api/v1/todos').set('Authorization', A.bearer).send({ title: 'x', categoryId: c.body.categoryId });
    const r = await request(app).delete(`/api/v1/categories/${c.body.categoryId}`).set('Authorization', A.bearer);
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('CATEGORY_HAS_TODOS');
  });
});
