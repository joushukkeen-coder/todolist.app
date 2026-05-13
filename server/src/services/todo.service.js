const AppError = require('../utils/AppError');
const todoRepository = require('../repositories/todo.repository');
const categoryRepository = require('../repositories/category.repository');

async function assertCategoryAccessible(userId, categoryId) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new AppError('CATEGORY_NOT_FOUND', 404, '카테고리를 찾을 수 없습니다');
  }
  const accessible = category.isDefault || category.userId === userId;
  if (!accessible) {
    throw new AppError('CATEGORY_NOT_FOUND', 404, '카테고리를 찾을 수 없습니다');
  }
  return category;
}

async function create(userId, { categoryId, title, description, dueDate }) {
  if (!categoryId) {
    throw new AppError('VALIDATION_ERROR', 400, 'categoryId는 필수입니다');
  }
  await assertCategoryAccessible(userId, categoryId);
  return todoRepository.insertOne({ userId, categoryId, title, description, dueDate });
}

async function listForUser(userId, filters = {}) {
  return todoRepository.findAllByUserId(userId, filters);
}

async function loadOwned(userId, todoId) {
  const todo = await todoRepository.findById(todoId);
  if (!todo) {
    throw new AppError('TODO_NOT_FOUND', 404, '할일을 찾을 수 없습니다');
  }
  if (todo.userId !== userId) {
    throw new AppError('FORBIDDEN', 403, '권한이 없습니다');
  }
  return todo;
}

async function update(userId, todoId, body) {
  await loadOwned(userId, todoId);

  const allowed = ['title', 'description', 'dueDate', 'categoryId'];
  const fields = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields[key] = body[key];
    }
  }

  if (fields.categoryId !== undefined) {
    await assertCategoryAccessible(userId, fields.categoryId);
  }
  if (fields.title !== undefined) {
    if (typeof fields.title !== 'string' || fields.title.length < 1 || fields.title.length > 200) {
      throw new AppError('VALIDATION_ERROR', 400, '제목은 1자 이상 200자 이하여야 합니다');
    }
  }

  return todoRepository.updateById(todoId, fields);
}

async function remove(userId, todoId) {
  await loadOwned(userId, todoId);
  await todoRepository.deleteById(todoId);
}

async function complete(userId, todoId) {
  const todo = await loadOwned(userId, todoId);
  if (todo.isCompleted) {
    throw new AppError('TODO_ALREADY_COMPLETED', 409, '이미 완료된 할일입니다');
  }
  return todoRepository.updateById(todoId, { isCompleted: true, completedAt: new Date() });
}

async function reopen(userId, todoId) {
  const todo = await loadOwned(userId, todoId);
  if (!todo.isCompleted) {
    throw new AppError('TODO_NOT_COMPLETED', 409, '완료되지 않은 할일입니다');
  }
  return todoRepository.updateById(todoId, { isCompleted: false, completedAt: null });
}

module.exports = { create, listForUser, update, remove, complete, reopen };
