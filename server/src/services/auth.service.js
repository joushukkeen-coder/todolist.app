const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signToken } = require('../utils/jwt');
const userRepository = require('../repositories/user.repository');

async function register({ email, password, name }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 409, '이미 등록된 이메일입니다');
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.insertOne({ email, passwordHash, name });
  return user;
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 401, '이메일 또는 비밀번호가 올바르지 않습니다');
  }
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    throw new AppError('INVALID_CREDENTIALS', 401, '이메일 또는 비밀번호가 올바르지 않습니다');
  }

  const accessToken = signToken({ userId: user.userId });
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
