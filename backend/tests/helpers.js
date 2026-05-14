const request = require('supertest');
const pool = require('../src/db/pool');
const app = require('../src/app');

async function truncateAll() {
  await pool.query('TRUNCATE TABLE todos, categories, users RESTART IDENTITY CASCADE');
  // 기본 카테고리 재시드
  await pool.query(`
    INSERT INTO categories (user_id, name, color_code, is_default)
    VALUES (NULL, '개인', '#4A90D9', TRUE),
           (NULL, '업무', '#E8503A', TRUE),
           (NULL, '쇼핑', '#2ECC71', TRUE)
  `);
}

async function registerAndLogin(email = 'user@example.com', password = 'password1', name = '테스터') {
  await request(app).post('/api/v1/auth/register').send({ email, password, name });
  const r = await request(app).post('/api/v1/auth/login').send({ email, password });
  return { token: r.body.accessToken, bearer: `Bearer ${r.body.accessToken}`, user: r.body.user };
}

async function getDefaultCategoryId(bearer) {
  const r = await request(app).get('/api/v1/categories').set('Authorization', bearer);
  return r.body.categories.find(c => c.isDefault).categoryId;
}

module.exports = { truncateAll, registerAndLogin, getDefaultCategoryId, app, pool };
