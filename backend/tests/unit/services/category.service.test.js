jest.mock('../../../src/repositories/category.repository');

const categoryRepository = require('../../../src/repositories/category.repository');
const categoryService = require('../../../src/services/category.service');

beforeEach(() => jest.clearAllMocks());

describe('categoryService.create', () => {
  test('동일 이름 중복 → CATEGORY_NAME_DUPLICATE', async () => {
    categoryRepository.findByUserAndName.mockResolvedValue({ categoryId: 'c1' });
    await expect(categoryService.create('u1', { name: 'dup', colorCode: '#111111' }))
      .rejects.toMatchObject({ code: 'CATEGORY_NAME_DUPLICATE', statusCode: 409 });
  });

  test('정상 → insertOne 호출', async () => {
    categoryRepository.findByUserAndName.mockResolvedValue(null);
    categoryRepository.insertOne.mockResolvedValue({ categoryId: 'c1' });
    await categoryService.create('u1', { name: 'new', colorCode: '#111111' });
    expect(categoryRepository.insertOne).toHaveBeenCalledWith({ userId: 'u1', name: 'new', colorCode: '#111111' });
  });
});

describe('categoryService.update (소유권/기본 카테고리 검증)', () => {
  test('미존재 → CATEGORY_NOT_FOUND', async () => {
    categoryRepository.findById.mockResolvedValue(null);
    await expect(categoryService.update('u1', 'c1', { name: 'x' }))
      .rejects.toMatchObject({ code: 'CATEGORY_NOT_FOUND', statusCode: 404 });
  });

  test('isDefault=true → DEFAULT_CATEGORY_IMMUTABLE', async () => {
    categoryRepository.findById.mockResolvedValue({ categoryId: 'c1', userId: null, isDefault: true });
    await expect(categoryService.update('u1', 'c1', { name: 'x' }))
      .rejects.toMatchObject({ code: 'DEFAULT_CATEGORY_IMMUTABLE', statusCode: 403 });
  });

  test('타인 소유 → FORBIDDEN', async () => {
    categoryRepository.findById.mockResolvedValue({ categoryId: 'c1', userId: 'other', isDefault: false });
    await expect(categoryService.update('u1', 'c1', { name: 'x' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  test('정상 → updateById 호출', async () => {
    categoryRepository.findById.mockResolvedValue({ categoryId: 'c1', userId: 'u1', isDefault: false });
    categoryRepository.findByUserAndName.mockResolvedValue(null);
    categoryRepository.updateById.mockResolvedValue({ categoryId: 'c1', name: '수정' });
    await categoryService.update('u1', 'c1', { name: '수정' });
    expect(categoryRepository.updateById).toHaveBeenCalled();
  });
});

describe('categoryService.remove', () => {
  test('연결된 todos 존재 → CATEGORY_HAS_TODOS', async () => {
    categoryRepository.findById.mockResolvedValue({ categoryId: 'c1', userId: 'u1', isDefault: false });
    categoryRepository.countTodos.mockResolvedValue(3);
    await expect(categoryService.remove('u1', 'c1'))
      .rejects.toMatchObject({ code: 'CATEGORY_HAS_TODOS', statusCode: 409 });
  });

  test('정상 → deleteById 호출', async () => {
    categoryRepository.findById.mockResolvedValue({ categoryId: 'c1', userId: 'u1', isDefault: false });
    categoryRepository.countTodos.mockResolvedValue(0);
    await categoryService.remove('u1', 'c1');
    expect(categoryRepository.deleteById).toHaveBeenCalledWith('c1');
  });
});
