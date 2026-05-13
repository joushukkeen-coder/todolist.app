jest.mock('../../../src/repositories/todo.repository');
jest.mock('../../../src/repositories/category.repository');

const todoRepository = require('../../../src/repositories/todo.repository');
const categoryRepository = require('../../../src/repositories/category.repository');
const todoService = require('../../../src/services/todo.service');

beforeEach(() => jest.clearAllMocks());

describe('todoService.create', () => {
  test('categoryId 누락 → VALIDATION_ERROR', async () => {
    await expect(todoService.create('u1', { title: 'x' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('미존재 categoryId → CATEGORY_NOT_FOUND', async () => {
    categoryRepository.findById.mockResolvedValue(null);
    await expect(todoService.create('u1', { title: 'x', categoryId: 'cX' }))
      .rejects.toMatchObject({ code: 'CATEGORY_NOT_FOUND', statusCode: 404 });
  });

  test('타인 카테고리 → CATEGORY_NOT_FOUND', async () => {
    categoryRepository.findById.mockResolvedValue({ categoryId: 'c1', userId: 'other', isDefault: false });
    await expect(todoService.create('u1', { title: 'x', categoryId: 'c1' }))
      .rejects.toMatchObject({ code: 'CATEGORY_NOT_FOUND' });
  });

  test('기본 카테고리 사용 → insertOne 호출 가능', async () => {
    categoryRepository.findById.mockResolvedValue({ categoryId: 'c1', userId: null, isDefault: true });
    todoRepository.insertOne.mockResolvedValue({ todoId: 't1' });
    await todoService.create('u1', { title: 'x', categoryId: 'c1' });
    expect(todoRepository.insertOne).toHaveBeenCalled();
  });
});

describe('todoService.update/remove (소유권 검증)', () => {
  test('미존재 → TODO_NOT_FOUND', async () => {
    todoRepository.findById.mockResolvedValue(null);
    await expect(todoService.update('u1', 't1', { title: 'x' }))
      .rejects.toMatchObject({ code: 'TODO_NOT_FOUND' });
  });

  test('타인 소유 → FORBIDDEN', async () => {
    todoRepository.findById.mockResolvedValue({ todoId: 't1', userId: 'other' });
    await expect(todoService.update('u1', 't1', { title: 'x' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
    await expect(todoService.remove('u1', 't1'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('title 200자 초과 → VALIDATION_ERROR', async () => {
    todoRepository.findById.mockResolvedValue({ todoId: 't1', userId: 'u1' });
    await expect(todoService.update('u1', 't1', { title: 'x'.repeat(201) }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('todoService.complete/reopen (완료 상태 중복 변경 방지)', () => {
  test('이미 완료된 todo /complete → TODO_ALREADY_COMPLETED', async () => {
    todoRepository.findById.mockResolvedValue({ todoId: 't1', userId: 'u1', isCompleted: true });
    await expect(todoService.complete('u1', 't1'))
      .rejects.toMatchObject({ code: 'TODO_ALREADY_COMPLETED', statusCode: 409 });
  });

  test('이미 미완료 todo /reopen → TODO_NOT_COMPLETED', async () => {
    todoRepository.findById.mockResolvedValue({ todoId: 't1', userId: 'u1', isCompleted: false });
    await expect(todoService.reopen('u1', 't1'))
      .rejects.toMatchObject({ code: 'TODO_NOT_COMPLETED', statusCode: 409 });
  });

  test('정상 complete → isCompleted=true, completedAt=Date', async () => {
    todoRepository.findById.mockResolvedValue({ todoId: 't1', userId: 'u1', isCompleted: false });
    todoRepository.updateById.mockResolvedValue({ todoId: 't1', isCompleted: true });
    await todoService.complete('u1', 't1');
    const arg = todoRepository.updateById.mock.calls[0][1];
    expect(arg.isCompleted).toBe(true);
    expect(arg.completedAt).toBeInstanceOf(Date);
  });

  test('정상 reopen → isCompleted=false, completedAt=null', async () => {
    todoRepository.findById.mockResolvedValue({ todoId: 't1', userId: 'u1', isCompleted: true });
    todoRepository.updateById.mockResolvedValue({ todoId: 't1', isCompleted: false });
    await todoService.reopen('u1', 't1');
    expect(todoRepository.updateById).toHaveBeenCalledWith('t1', { isCompleted: false, completedAt: null });
  });
});

describe('todoService.listForUser (기간 필터 NULL 제외는 Repository에서 처리)', () => {
  test('filters 전달', async () => {
    todoRepository.findAllByUserId.mockResolvedValue([]);
    await todoService.listForUser('u1', { dueDateFrom: '2026-05-01' });
    expect(todoRepository.findAllByUserId).toHaveBeenCalledWith('u1', { dueDateFrom: '2026-05-01' });
  });
});
