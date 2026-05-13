import type { Category } from '@/types/category.types';
import type { TodoFilters } from '@/types/todo.types';
import { useUIStore } from '@/store/uiStore';
import './TodoFilterPanel.css';

interface Props {
  categories: Category[];
  filters: TodoFilters;
  onChange: (patch: Partial<TodoFilters>) => void;
  onReset: () => void;
}

export default function TodoFilterPanel({ categories, filters, onChange, onReset }: Props) {
  const open = useUIStore((s) => s.filterPanelOpen);
  const toggle = useUIStore((s) => s.toggleFilterPanel);

  const completedValue =
    filters.isCompleted === undefined ? 'all' : filters.isCompleted ? 'done' : 'todo';

  return (
    <aside
      className={`todo-filter-panel${open ? ' todo-filter-panel--open' : ''}`}
      aria-label="필터"
    >
      <button type="button" className="todo-filter-panel__toggle" onClick={toggle}>
        필터 {open ? '닫기' : '열기'}
      </button>
      <div className="todo-filter-panel__body">
        <label>
          카테고리
          <select
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
        </label>

        <fieldset>
          <legend>완료 여부</legend>
          {(['all', 'todo', 'done'] as const).map((v) => (
            <label key={v}>
              <input
                type="radio"
                name="completed"
                checked={completedValue === v}
                onChange={() => onChange({ isCompleted: v === 'all' ? undefined : v === 'done' })}
              />
              {v === 'all' ? '전체' : v === 'todo' ? '미완료' : '완료'}
            </label>
          ))}
        </fieldset>

        <label>
          종료예정일 시작
          <input
            type="date"
            value={filters.dueDateFrom ?? ''}
            onChange={(e) => onChange({ dueDateFrom: e.target.value || undefined })}
          />
        </label>
        <label>
          종료예정일 종료
          <input
            type="date"
            value={filters.dueDateTo ?? ''}
            onChange={(e) => onChange({ dueDateTo: e.target.value || undefined })}
          />
        </label>

        <button type="button" onClick={onReset} className="todo-filter-panel__reset">
          필터 초기화
        </button>
      </div>
    </aside>
  );
}
