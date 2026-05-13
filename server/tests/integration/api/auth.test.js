const request = require('supertest');
const { truncateAll, app, pool } = require('../../helpers');

beforeEach(async () => { await truncateAll(); });
afterAll(async () => { await pool.end(); });

describe('POST /api/v1/auth/register', () => {
  test('정상 회원가입 → 201 + userId/email/name/createdAt + password_hash 미포함', async () => {
    const r = await request(app).post('/api/v1/auth/register')
      .send({ email: 'a@example.com', password: 'password1', name: '사용자' });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ email: 'a@example.com', name: '사용자' });
    expect(r.body.userId).toBeDefined();
    expect(r.body.createdAt).toBeDefined();
    expect(r.body.passwordHash).toBeUndefined();
    expect(r.body.password_hash).toBeUndefined();
  });

  test('이메일 중복 → 409 EMAIL_ALREADY_EXISTS', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'a@example.com', password: 'password1', name: 'A' });
    const r = await request(app).post('/api/v1/auth/register').send({ email: 'a@example.com', password: 'password1', name: 'B' });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  test('비밀번호 8자 미만 → 400 VALIDATION_ERROR', async () => {
    const r = await request(app).post('/api/v1/auth/register').send({ email: 'a@example.com', password: 'short', name: 'A' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('잘못된 이메일 형식 → 400', async () => {
    const r = await request(app).post('/api/v1/auth/register').send({ email: 'invalid', password: 'password1', name: 'A' });
    expect(r.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'a@example.com', password: 'password1', name: 'A' });
  });

  test('정상 로그인 → 200 + accessToken + user', async () => {
    const r = await request(app).post('/api/v1/auth/login').send({ email: 'a@example.com', password: 'password1' });
    expect(r.status).toBe(200);
    expect(typeof r.body.accessToken).toBe('string');
    expect(r.body.user.email).toBe('a@example.com');
    expect(r.body.user.passwordHash).toBeUndefined();
  });

  test('이메일 미존재 → 401 INVALID_CREDENTIALS', async () => {
    const r = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@example.com', password: 'password1' });
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('비밀번호 불일치 → 401 INVALID_CREDENTIALS', async () => {
    const r = await request(app).post('/api/v1/auth/login').send({ email: 'a@example.com', password: 'wrongword' });
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
