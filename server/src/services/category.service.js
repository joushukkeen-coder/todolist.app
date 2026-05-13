const AppError = require('../utils/AppError');
const categoryRepository = require('../repositories/category.repository');

async function listForUser(userId) {
  return categoryRepository.findAllByUserId(userId);
}

async function create(userId, { name, colorCode }) {
  const dup = await categoryRepository.findByUserAndName(userId, name);
  if (dup) {
    throw new AppError('CATEGORY_NAME_DUPLICATE', 409, '이미 동일한 이름의 카테고리가 존재합니다');
  }
  return categoryRepository.insertOne({ userId, name, colorCode });
}

async function loadOwnedEditable(userId, categoryId) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new AppError('CATEGORY_NOT_FOUND', 404, '카테고리를 찾을 수 없습니다');
  }
  if (category.isDefault) {
    throw new AppError('DEFAULT_CATEGORY_IMMUTABLE', 403, '기본 카테고리는 수정·삭제할 수 없습니다');
  }
  if (category.userId !== userId) {
    throw new AppError('FORBIDDEN', 403, '권한이 없습니다');
  }
  return category;
}

async function update(userId, categoryId, { name, colorCode }) {
  await loadOwnedEditable(userId, categoryId);

  if (name !== undefined) {
    const dup = await categoryRepository.findByUserAndName(userId, name);
    if (dup && dup.categoryId !== categoryId) {
      throw new AppError('CATEGORY_NAME_DUPLICATE', 409, '이미 동일한 이름의 카테고리가 존재합니다');
    }
  }

  return categoryRepository.updateById(categoryId, { name, colorCode });
}

async function remove(userId, categoryId) {
  await loadOwnedEditable(userId, categoryId);
  const todoCount = await categoryRepository.countTodos(categoryId);
  if (todoCount > 0) {
    throw new AppError('CATEGORY_HAS_TODOS', 409, '연결된 할일이 있는 카테고리는 삭제할 수 없습니다');
  }
  await categoryRepository.deleteById(categoryId);
}

module.exports = { listForUser, create, update, remove };
