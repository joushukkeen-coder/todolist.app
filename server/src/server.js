const app = require('./app');
const config = require('./config/env');
const pool = require('./db/pool');

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('[server] DB 연결 확인 완료');
  } catch (err) {
    console.error('[server] DB 연결 실패:', err.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`[server] listening on port ${config.port} (${config.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} 수신, graceful shutdown 시작`);
    server.close(async () => {
      try {
        await pool.end();
        console.log('[server] pg pool 종료 완료');
        process.exit(0);
      } catch (err) {
        console.error('[server] pool.end() 오류:', err.message);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
