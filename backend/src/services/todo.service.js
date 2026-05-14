const AppError = require('../utils/AppError');
const todoRepository = require('../repositories/todo.repository');
const categoryRepository = require('../repositories/category.repository');
const logger = require('../utils/logger');

async function assertCategoryAccessible(userId, categoryId) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    logger.warn('todo.service', 'category not found', { userId, categoryId });
    throw new AppError('CATEGORY_NOT_FOUND', 404, '카테고리를 찾을 수 없습니다');
  }
  const accessible = category.isDefault || category.userId === userId;
  if (!accessible) {
    logger.warn('todo.service', 'category not accessible', { userId, categoryId, ownerId: category.userId });
    throw new AppError('CATEGORY_NOT_FOUND', 404, '카테고리를 찾을 수 없습니다');
  }
  return category;
}

async function create(userId, { categoryId, title, description, dueDate }) {
  logger.info('todo.service', 'create requested', { userId, categoryId });
  if (!categoryId) {
    throw new AppError('VALIDATION_ERROR', 400, 'categoryId는 필수입니다');
  }
  await assertCategoryAccessible(userId, categoryId);
  const todo = await todoRepository.insertOne({ userId, categoryId, title, description, dueDate });
  logger.info('todo.service', 'create success', { userId, todoId: todo.todoId });
  return todo;
}

async function listForUser(userId, filters = {}) {
  logger.info('todo.service', 'list requested', { userId, filters });
  const rows = await todoRepository.findAllByUserId(userId, filters);
  logger.info('todo.service', 'list result', { userId, count: rows.length });
  return rows;
}

async function loadOwned(userId, todoId) {
  const todo = await todoRepository.findById(todoId);
  if (!todo) {
    logger.warn('todo.service', 'todo not found', { userId, todoId });
    throw new AppError('TODO_NOT_FOUND', 404, '할일을 찾을 수 없습니다');
  }
  if (todo.userId !== userId) {
    logger.warn('todo.service', 'todo forbidden', { userId, todoId, ownerId: todo.userId });
    throw new AppError('FORBIDDEN', 403, '권한이 없습니다');
  }
  return todo;
}

async function update(userId, todoId, body) {
  logger.info('todo.service', 'update requested', { userId, todoId, fields: Object.keys(body) });
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

  const updated = await todoRepository.updateById(todoId, fields);
  logger.info('todo.service', 'update success', { userId, todoId });
  return updated;
}

async function remove(userId, todoId) {
  logger.info('todo.service', 'delete requested', { userId, todoId });
  await loadOwned(userId, todoId);
  await todoRepository.deleteById(todoId);
  logger.info('todo.service', 'delete success', { userId, todoId });
}

async function complete(userId, todoId) {
  logger.info('todo.service', 'complete requested', { userId, todoId });
  const todo = await loadOwned(userId, todoId);
  if (todo.isCompleted) {
    throw new AppError('TODO_ALREADY_COMPLETED', 409, '이미 완료된 할일입니다');
  }
  const updated = await todoRepository.updateById(todoId, { isCompleted: true, completedAt: new Date() });
  logger.info('todo.service', 'complete success', { userId, todoId });
  return updated;
}

async function reopen(userId, todoId) {
  logger.info('todo.service', 'reopen requested', { userId, todoId });
  const todo = await loadOwned(userId, todoId);
  if (!todo.isCompleted) {
    throw new AppError('TODO_NOT_COMPLETED', 409, '완료되지 않은 할일입니다');
  }
  const updated = await todoRepository.updateById(todoId, { isCompleted: false, completedAt: null });
  logger.info('todo.service', 'reopen success', { userId, todoId });
  return updated;
}

module.exports = { create, listForUser, update, remove, complete, reopen };
