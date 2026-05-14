const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/hash');
const userRepository = require('../repositories/user.repository');

async function updateProfile(userId, { email, name, currentPassword, newPassword }) {
  if (email !== undefined) {
    throw new AppError('EMAIL_CHANGE_NOT_ALLOWED', 400, '이메일은 변경할 수 없습니다');
  }

  const fields = {};
  if (name !== undefined) fields.name = name;

  if (newPassword !== undefined) {
    if (newPassword.length < 8) {
      throw new AppError('VALIDATION_ERROR', 400, '비밀번호는 8자 이상이어야 합니다');
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, '사용자를 찾을 수 없습니다');
    }
    const ok = currentPassword
      ? await comparePassword(currentPassword, user.passwordHash)
      : false;
    if (!ok) {
      throw new AppError('INVALID_CURRENT_PASSWORD', 401, '현재 비밀번호가 올바르지 않습니다');
    }
    fields.passwordHash = await hashPassword(newPassword);
  }

  const updated = await userRepository.updateById(userId, fields);
  if (!updated) {
    throw new AppError('USER_NOT_FOUND', 404, '사용자를 찾을 수 없습니다');
  }
  return updated;
}

async function deleteAccount(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 404, '사용자를 찾을 수 없습니다');
  }
  await userRepository.deleteById(userId);
}

module.exports = { updateProfile, deleteAccount };
