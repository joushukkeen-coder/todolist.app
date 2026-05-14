const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signToken } = require('../utils/jwt');
const userRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');

async function register({ email, password, name }) {
  logger.info('auth.service', 'register requested', { email });
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    logger.warn('auth.service', 'register email duplicate', { email });
    throw new AppError('EMAIL_ALREADY_EXISTS', 409, '이미 등록된 이메일입니다');
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.insertOne({ email, passwordHash, name });
  logger.info('auth.service', 'register success', { userId: user.userId, email });
  return user;
}

async function login({ email, password }) {
  logger.info('auth.service', 'login requested', { email });
  const user = await userRepository.findByEmail(email);
  if (!user) {
    logger.warn('auth.service', 'login user not found', { email });
    throw new AppError('INVALID_CREDENTIALS', 401, '이메일 또는 비밀번호가 올바르지 않습니다');
  }
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    logger.warn('auth.service', 'login password mismatch', { userId: user.userId });
    throw new AppError('INVALID_CREDENTIALS', 401, '이메일 또는 비밀번호가 올바르지 않습니다');
  }

  const accessToken = signToken({ userId: user.userId });
  logger.info('auth.service', 'login success', { userId: user.userId });
  return {
    accessToken,
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  };
}

module.exports = { register, login };
