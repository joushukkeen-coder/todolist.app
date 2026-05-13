const express = require('express');
const request = require('supertest');

const AppError = require('../src/utils/AppError');
const { signToken } = require('../src/utils/jwt');
const { hashPassword, comparePassword } = require('../src/utils/hash');
const auth = require('../src/middlewares/auth');
const errorHandler = require('../src/middlewares/errorHandler');

const app = express();
app.use(express.json());

app.get('/protected', auth, (req, res) => res.json({ userId: req.user.userId }));
app.get('/known-error', (req, res, next) =>
  next(new AppError('SAMPLE_ERROR', 418, 'sample message'))
);
app.get('/unknown-error', (req, res, next) => {
  next(new Error('boom'));
});

app.use(errorHandler);

(async () => {
  let pass = 0;
  let fail = 0;
  const check = (label, cond) => {
    console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}`);
    cond ? pass++ : fail++;
  };

  const hash = await hashPassword('mypassword');
  check('hash.js: bcrypt hash 길이>0', hash.length > 0);
  check('hash.js: comparePassword(true)', await comparePassword('mypassword', hash));
  check('hash.js: comparePassword(false)', !(await comparePassword('wrong', hash)));

  const token = signToken({ userId: 'u-123' });
  check('jwt.js: signToken 결과 3구획', token.split('.').length === 3);

  const r1 = await request(app).get('/protected');
  check('auth: 헤더 없음 401/UNAUTHORIZED', r1.status === 401 && r1.body.error.code === 'UNAUTHORIZED');

  const r2 = await request(app).get('/protected').set('Authorization', 'Bearer invalid.token.here');
  check('auth: 위변조 토큰 401', r2.status === 401 && r2.body.error.code === 'UNAUTHORIZED');

  const r3 = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
  check('auth: 정상 토큰 200 + req.user.userId 주입', r3.status === 200 && r3.body.userId === 'u-123');

  const r4 = await request(app).get('/known-error');
  check('errorHandler: AppError 통과', r4.status === 418 && r4.body.error.code === 'SAMPLE_ERROR' && r4.body.error.message === 'sample message');

  const r5 = await request(app).get('/unknown-error');
  check('errorHandler: 예상치 못한 에러 500/INTERNAL_SERVER_ERROR', r5.status === 500 && r5.body.error.code === 'INTERNAL_SERVER_ERROR');
  check('errorHandler: development 환경에서 stack 포함', typeof r5.body.error.stack === 'string');

  console.log(`\n총 ${pass + fail}건 / 통과 ${pass} / 실패 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
