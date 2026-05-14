import { describe, test, expect } from 'vitest';
import { todoKeys, categoryKeys } from './index';

describe('todoKeys 팩토리', () => {
  test('all → ["todos"]', () => {
    expect(todoKeys.all).toEqual(['todos']);
  });
  test('lists() → ["todos","list"]', () => {
    expect(todoKeys.lists()).toEqual(['todos', 'list']);
  });
  test('list(filters) → 필터 객체 포함', () => {
    expect(todoKeys.list({ categoryId: 'c1' })).toEqual(['todos', 'list', { categoryId: 'c1' }]);
  });
  test('list() 기본값 → 빈 필터', () => {
    expect(todoKeys.list()).toEqual(['todos', 'list', {}]);
  });
  test('detail(id) → ["todos","detail",id]', () => {
    expect(todoKeys.detail('t1')).toEqual(['todos', 'detail', 't1']);
  });
});

describe('categoryKeys 팩토리', () => {
  test('all/lists/list 값', () => {
    expect(categoryKeys.all).toEqual(['categories']);
    expect(categoryKeys.lists()).toEqual(['categories', 'list']);
    expect(categoryKeys.list()).toEqual(['categories', 'list']);
  });
});
