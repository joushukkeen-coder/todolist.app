const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const ROOT = path.resolve(__dirname, '..', '..');

// 1) 공통 .env (모든 환경의 기본값) - 존재 시 먼저 로드
const baseEnv = path.join(ROOT, '.env');
if (fs.existsSync(baseEnv)) {
  dotenv.config({ path: baseEnv });
}

// 2) NODE_ENV별 .env.{env} 파일로 덮어쓰기
const envFile =
  process.env.NODE_ENV === 'production' ? '.env.production'
  : process.env.NODE_ENV === 'test' ? '.env.test'
  : '.env.development';
const envFilePath = path.join(ROOT, envFile);
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath, override: true });
}

const REQUIRED = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[config/env] 필수 환경 변수 누락: ${missing.join(', ')}`);
  process.exit(1);
}

function parseCorsOrigin(raw) {
  if (!raw || raw.trim() === '*') return '*';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  cors: {
    origin: parseCorsOrigin(process.env.CORS_ORIGIN),
  },
};
