import { describe, test, expect } from 'vitest';
import { todoKeys, categoryKeys } from './index';

describe('query-keys', () => {
  test('todoKeys 계층 구조', () => {
    expect(todoKeys.all).toEqual(['todos']);
    expect(todoKeys.lists()).toEqual(['todos', 'list']);
    expect(todoKeys.list({})).toEqual(['todos', 'list', {}]);
    expect(todoKeys.list({ isCompleted: true })).toEqual(['todos', 'list', { isCompleted: true }]);
    expect(todoKeys.detail('t1')).toEqual(['todos', 'detail', 't1']);
  });

  test('categoryKeys 계층 구조', () => {
    expect(categoryKeys.all).toEqual(['categories']);
    expect(categoryKeys.lists()).toEqual(['categories', 'list']);
    expect(categoryKeys.list()).toEqual(['categories', 'list']);
  });
});
