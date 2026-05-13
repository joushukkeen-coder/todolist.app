const pool = require('../src/db/pool');

(async () => {
  try {
    const result = await pool.query('SELECT 1 AS ok');
    console.log('[db:ping] 성공:', result.rows[0]);
    console.log('[db:ping] 동일 인스턴스 검증:', pool === require('../src/db/pool'));
    process.exitCode = 0;
  } catch (err) {
    console.error('[db:ping] 실패:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
