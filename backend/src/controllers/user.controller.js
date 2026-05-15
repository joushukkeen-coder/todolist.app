const userService = require('../services/user.service');

const userRepository = require('../repositories/user.repository');

async function getMe(req, res, next) {
  try {
    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      const AppError = require('../utils/AppError');
      throw new AppError('USER_NOT_FOUND', 404, '사용자를 찾을 수 없습니다');
    }
    res.status(200).json({
      userId: user.userId,
      email: user.email,
      name: user.name,
      darkMode: user.darkMode,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

async function patchMe(req, res, next) {
  try {
    const updated = await userService.updateProfile(req.user.userId, req.body);
    res.status(200).json({
      userId: updated.userId,
      email: updated.email,
      name: updated.name,
      darkMode: updated.darkMode,
      language: updated.language,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteMe(req, res, next) {
  try {
    await userService.deleteAccount(req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.updateProfile(req.user.userId, { currentPassword, newPassword });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, patchMe, deleteMe, changePassword };
