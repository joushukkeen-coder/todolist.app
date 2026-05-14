const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 401, '인증이 필요합니다'));
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return next(new AppError('UNAUTHORIZED', 401, '유효하지 않은 토큰입니다'));
    }
    req.user = { userId: payload.userId };
    return next();
  } catch (err) {
    return next(new AppError('UNAUTHORIZED', 401, '유효하지 않은 토큰입니다'));
  }
};
