const AppError = require('../utils/AppError');
const categoryRepository = require('../repositories/category.repository');
const logger = require('../utils/logger');

async function listForUser(userId) {
  logger.info('category.service', 'list requested', { userId });
  const rows = await categoryRepository.findAllByUserId(userId);
  logger.info('category.service', 'list result', { userId, count: rows.length });
  return rows;
}

async function create(userId, { name, colorCode }) {
  logger.info('category.service', 'create requested', { userId, name });
  const dup = await categoryRepository.findByUserAndName(userId, name);
  if (dup) {
    logger.warn('category.service', 'create name duplicate', { userId, name });
    throw new AppError('CATEGORY_NAME_DUPLICATE', 409, '이미 동일한 이름의 카테고리가 존재합니다');
  }
  const cat = await categoryRepository.insertOne({ userId, name, colorCode });
  logger.info('category.service', 'create success', { userId, categoryId: cat.categoryId });
  return cat;
}

async function loadOwnedEditable(userId, categoryId) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    logger.warn('category.service', 'category not found', { userId, categoryId });
    throw new AppError('CATEGORY_NOT_FOUND', 404, '카테고리를 찾을 수 없습니다');
  }
  if (category.isDefault) {
    logger.warn('category.service', 'default category immutable', { userId, categoryId });
    throw new AppError('DEFAULT_CATEGORY_IMMUTABLE', 403, '기본 카테고리는 수정·삭제할 수 없습니다');
  }
  if (category.userId !== userId) {
    logger.warn('category.service', 'category forbidden', { userId, categoryId, ownerId: category.userId });
    throw new AppError('FORBIDDEN', 403, '권한이 없습니다');
  }
  return category;
}

async function update(userId, categoryId, { name, colorCode }) {
  logger.info('category.service', 'update requested', { userId, categoryId });
  await loadOwnedEditable(userId, categoryId);

  if (name !== undefined) {
    const dup = await categoryRepository.findByUserAndName(userId, name);
    if (dup && dup.categoryId !== categoryId) {
      logger.warn('category.service', 'update name duplicate', { userId, categoryId, name });
      throw new AppError('CATEGORY_NAME_DUPLICATE', 409, '이미 동일한 이름의 카테고리가 존재합니다');
    }
  }

  const updated = await categoryRepository.updateById(categoryId, { name, colorCode });
  logger.info('category.service', 'update success', { userId, categoryId });
  return updated;
}

async function remove(userId, categoryId) {
  logger.info('category.service', 'delete requested', { userId, categoryId });
  await loadOwnedEditable(userId, categoryId);
  const todoCount = await categoryRepository.countTodos(categoryId);
  if (todoCount > 0) {
    logger.warn('category.service', 'delete blocked: has todos', { userId, categoryId, todoCount });
    throw new AppError('CATEGORY_HAS_TODOS', 409, '연결된 할일이 있는 카테고리는 삭제할 수 없습니다');
  }
  await categoryRepository.deleteById(categoryId);
  logger.info('category.service', 'delete success', { userId, categoryId });
}

module.exports = { listForUser, create, update, remove };
