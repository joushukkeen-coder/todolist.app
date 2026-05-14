const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    logger.warn('auth', 'missing or malformed Authorization header', {
      method: req.method,
      path: req.originalUrl,
    });
    return next(new AppError('UNAUTHORIZED', 401, '인증이 필요합니다'));
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      logger.warn('auth', 'token payload missing userId', { path: req.originalUrl });
      return next(new AppError('UNAUTHORIZED', 401, '유효하지 않은 토큰입니다'));
    }
    req.user = { userId: payload.userId };
    logger.info('auth', 'authenticated', {
      userId: payload.userId,
      method: req.method,
      path: req.originalUrl,
    });
    return next();
  } catch (err) {
    logger.warn('auth', 'token verify failed', {
      path: req.originalUrl,
      reason: err.message,
    });
    return next(new AppError('UNAUTHORIZED', 401, '유효하지 않은 토큰입니다'));
  }
};
