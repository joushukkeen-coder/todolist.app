const cors = require('cors');
const config = require('../config/env');
const logger = require('../utils/logger');

function buildOriginChecker(allowed) {
  if (allowed === '*') return true;
  const allowList = Array.isArray(allowed) ? allowed : [allowed];
  return function originCheck(origin, cb) {
    // 같은 origin 요청·서버 간 호출은 origin 헤더가 없을 수 있어 허용
    if (!origin) return cb(null, true);
    if (allowList.includes(origin)) return cb(null, true);
    logger.warn('cors', 'origin not allowed', { origin, allowList });
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  };
}

const options = {
  origin: buildOriginChecker(config.cors.origin),
  credentials: false,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

logger.info('cors', 'configured', { origin: config.cors.origin });

module.exports = cors(options);
