const request = require('supertest');
const { truncateAll, registerAndLogin, app, pool } = require('../../helpers');

beforeEach(async () => { await truncateAll(); });
afterAll(async () => { await pool.end(); });

describe('PATCH /api/v1/users/me', () => {
  test('인증 누락 → 401', async () => {
    const r = await request(app).patch('/api/v1/users/me').send({ name: 'x' });
    expect(r.status).toBe(401);
  });

  test('정상 이름 변경 → 200', async () => {
    const { bearer } = await registerAndLogin();
    const r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer).send({ name: '새이름' });
    expect(r.status).toBe(200);
    expect(r.body.name).toBe('새이름');
    expect(r.body.passwordHash).toBeUndefined();
  });

  test('이메일 변경 → 400 EMAIL_CHANGE_NOT_ALLOWED', async () => {
    const { bearer } = await registerAndLogin();
    const r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer).send({ email: 'new@example.com' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('EMAIL_CHANGE_NOT_ALLOWED');
  });

  test('잘못된 currentPassword → 401 INVALID_CURRENT_PASSWORD', async () => {
    const { bearer } = await registerAndLogin();
    const r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer)
      .send({ currentPassword: 'wrongword', newPassword: 'newpassword1' });
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
  });

  test('newPassword 8자 미만 → 400 VALIDATION_ERROR', async () => {
    const { bearer } = await registerAndLogin();
    const r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer)
      .send({ currentPassword: 'password1', newPassword: 'short' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('이름+비밀번호 동시 변경 → 200, 새 비밀번호로 로그인 가능', async () => {
    const { bearer } = await registerAndLogin();
    let r = await request(app).patch('/api/v1/users/me').set('Authorization', bearer)
      .send({ name: '복합', currentPassword: 'password1', newPassword: 'newpassword1' });
    expect(r.status).toBe(200);
    r = await request(app).post('/api/v1/auth/login').send({ email: 'user@example.com', password: 'newpassword1' });
    expect(r.status).toBe(200);
  });
});

describe('DELETE /api/v1/users/me', () => {
  test('정상 탈퇴 → 204, CASCADE 영구 삭제', async () => {
    const { bearer } = await registerAndLogin();
    const cat = await request(app).post('/api/v1/categories').set('Authorization', bearer)
      .send({ name: 'tmp', colorCode: '#FFFFFF' });
    await request(app).post('/api/v1/todos').set('Authorization', bearer)
      .send({ title: 't', categoryId: cat.body.categoryId });
    const r = await request(app).delete('/api/v1/users/me').set('Authorization', bearer);
    expect(r.status).toBe(204);
    const re = await request(app).delete('/api/v1/users/me').set('Authorization', bearer);
    expect([401, 404]).toContain(re.status);
  });
});
