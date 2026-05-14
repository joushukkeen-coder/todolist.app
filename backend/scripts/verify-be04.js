const express = require('express');
const request = require('supertest');

const validate = require('../src/middlewares/validate');
const errorHandler = require('../src/middlewares/errorHandler');

const app = express();
app.use(express.json());

app.post(
  '/users',
  validate({ body: { email: 'email', password: 'password' } }),
  (req, res) => res.status(201).json({ ok: true })
);
app.post(
  '/todos',
  validate({ body: { title: 'title', categoryId: 'uuid' } }),
  (req, res) => res.status(201).json({ ok: true })
);
app.post(
  '/categories',
  validate({ body: { name: { rule: 'title' }, colorCode: 'colorCode' } }),
  (req, res) => res.status(201).json({ ok: true })
);
app.get(
  '/items/:id',
  validate({ params: { id: 'uuid' } }),
  (req, res) => res.json({ ok: true })
);
app.use(errorHandler);

(async () => {
  let pass = 0, fail = 0;
  const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}`); cond ? pass++ : fail++; };

  let r;

  r = await request(app).post('/users').send({ email: 'bad', password: 'short' });
  check('이메일/비밀번호 동시 위반 → 400 VALIDATION_ERROR + message 포함',
    r.status === 400 && r.body.error.code === 'VALIDATION_ERROR' && /이메일/.test(r.body.error.message) && /비밀번호/.test(r.body.error.message));

  r = await request(app).post('/users').send({ email: 'a@b.com', password: 'longenough' });
  check('정상 이메일+비밀번호 → 201', r.status === 201);

  r = await request(app).post('/todos').send({ title: '', categoryId: 'not-uuid' });
  check('빈 title + 잘못된 uuid → 400', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await request(app).post('/todos').send({ title: 'x'.repeat(201), categoryId: '11111111-2222-3333-4444-555555555555' });
  check('200자 초과 title → 400 (제목)', r.status === 400 && /제목/.test(r.body.error.message));

  r = await request(app).post('/todos').send({ title: '할일', categoryId: '11111111-2222-3333-4444-555555555555' });
  check('정상 todo → 201', r.status === 201);

  r = await request(app).post('/categories').send({ name: '카테', colorCode: 'red' });
  check('잘못된 colorCode → 400 (색상)', r.status === 400 && /색상/.test(r.body.error.message));

  r = await request(app).post('/categories').send({ name: '카테', colorCode: '#A1B2C3' });
  check('정상 colorCode → 201', r.status === 201);

  r = await request(app).get('/items/not-uuid');
  check('params uuid 위반 → 400', r.status === 400 && r.body.error.code === 'VALIDATION_ERROR');

  r = await request(app).get('/items/11111111-2222-3333-4444-555555555555');
  check('정상 uuid params → 200', r.status === 200);

  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
