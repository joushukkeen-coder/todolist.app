const { Pool, types } = require('pg');
const config = require('../config/env');

// PostgreSQL DATE(oid=1082)를 Date 객체로 변환하지 않고 'YYYY-MM-DD' 문자열 그대로 반환.
// 기본 파서는 로컬 타임존을 적용해 UTC 변환 시 하루 차이가 발생하는 문제가 있다.
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[db/pool] idle client 오류:', err.message);
});

module.exports = pool;
