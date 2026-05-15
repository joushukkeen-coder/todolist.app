const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/hash');
const userRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');

const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja'];

async function updateProfile(
  userId,
  { email, name, currentPassword, newPassword, darkMode, language },
) {
  logger.info('user.service', 'updateProfile requested', {
    userId,
    nameChanged: name !== undefined,
    passwordChange: newPassword !== undefined,
    darkModeChanged: darkMode !== undefined,
    languageChanged: language !== undefined,
  });
  if (email !== undefined) {
    logger.warn('user.service', 'email change attempt blocked', { userId });
    throw new AppError('EMAIL_CHANGE_NOT_ALLOWED', 400, '이메일은 변경할 수 없습니다');
  }

  const fields = {};
  if (name !== undefined) fields.name = name;
  if (darkMode !== undefined) {
    if (typeof darkMode !== 'boolean') {
      throw new AppError('VALIDATION_ERROR', 400, 'darkMode는 boolean이어야 합니다');
    }
    fields.darkMode = darkMode;
  }
  if (language !== undefined) {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        `language는 ${SUPPORTED_LANGUAGES.join(', ')} 중 하나여야 합니다`,
      );
    }
    fields.language = language;
  }

  if (newPassword !== undefined) {
    if (newPassword.length < 8) {
      throw new AppError('VALIDATION_ERROR', 400, '비밀번호는 8자 이상이어야 합니다');
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      logger.warn('user.service', 'user not found', { userId });
      throw new AppError('USER_NOT_FOUND', 404, '사용자를 찾을 수 없습니다');
    }
    const ok = currentPassword
      ? await comparePassword(currentPassword, user.passwordHash)
      : false;
    if (!ok) {
      logger.warn('user.service', 'current password mismatch', { userId });
      throw new AppError('INVALID_CURRENT_PASSWORD', 401, '현재 비밀번호가 올바르지 않습니다');
    }
    fields.passwordHash = await hashPassword(newPassword);
  }

  const updated = await userRepository.updateById(userId, fields);
  if (!updated) {
    throw new AppError('USER_NOT_FOUND', 404, '사용자를 찾을 수 없습니다');
  }
  logger.info('user.service', 'updateProfile success', { userId });
  return updated;
}

async function deleteAccount(userId) {
  logger.info('user.service', 'deleteAccount requested', { userId });
  const user = await userRepository.findById(userId);
  if (!user) {
    logger.warn('user.service', 'deleteAccount user not found', { userId });
    throw new AppError('USER_NOT_FOUND', 404, '사용자를 찾을 수 없습니다');
  }
  await userRepository.deleteById(userId);
  logger.info('user.service', 'deleteAccount success', { userId });
}

module.exports = { updateProfile, deleteAccount };
