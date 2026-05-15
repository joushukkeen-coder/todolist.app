import type { Category } from '@/types/category.types';
import type { TodoFilters } from '@/types/todo.types';
import Button from '@/components/common/Button';
import './TodoFilterPanel.css';

interface Props {
  categories: Category[];
  filters: TodoFilters;
  onChange: (patch: Partial<TodoFilters>) => void;
  onReset: () => void;
}

export default function TodoFilterPanel({ categories, filters, onChange, onReset }: Props) {
  const completedValue =
    filters.isCompleted === undefined ? 'all' : filters.isCompleted ? 'done' : 'undone';

  const setCompleted = (v: 'all' | 'done' | 'undone') => {
    if (v === 'all') onChange({ isCompleted: undefined });
    else onChange({ isCompleted: v === 'done' });
  };

  return (
    <aside className="todo-filter">
      <header className="todo-filter__header">
        <h2 className="todo-filter__title">필터</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          초기화
        </Button>
      </header>

      <div className="todo-filter__group">
        <label htmlFor="filter-category" className="todo-filter__label">
          카테고리
        </label>
        <select
          id="filter-category"
          className="todo-filter__select"
          value={filters.categoryId ?? ''}
          onChange={(e) => onChange({ categoryId: e.target.value || undefined })}
        >
          <option value="">전체</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="todo-filter__group" role="radiogroup" aria-label="완료 여부">
        <span className="todo-filter__label">완료 여부</span>
        <div className="todo-filter__segments">
          {(
            [
              ['all', '전체'],
              ['undone', '미완료'],
              ['done', '완료'],
            ] as const
          ).map(([val, lab]) => (
            <label key={val} className="todo-filter__segment">
              <input
                type="radio"
                name="completed"
                value={val}
                checked={completedValue === val}
                onChange={() => setCompleted(val)}
              />
              <span>{lab}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="todo-filter__group">
        <label htmlFor="filter-from" className="todo-filter__label">
          기간 (종료예정일)
        </label>
        <div className="todo-filter__range">
          <input
            id="filter-from"
            type="date"
            className="todo-filter__select"
            value={filters.dueDateFrom ?? ''}
            onChange={(e) => onChange({ dueDateFrom: e.target.value || undefined })}
            aria-label="시작일"
          />
          <span>~</span>
          <input
            type="date"
            className="todo-filter__select"
            value={filters.dueDateTo ?? ''}
            onChange={(e) => onChange({ dueDateTo: e.target.value || undefined })}
            aria-label="종료일"
          />
        </div>
      </div>
    </aside>
  );
}
