import type { Todo } from '@/types/todo.types';
import type { Category } from '@/types/category.types';
import CategoryBadge from '@/components/category/CategoryBadge';
import './TodoCard.css';

interface Props {
  todo: Todo;
  category?: Category;
  onToggle: (todo: Todo) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
}

export default function TodoCard({ todo, category, onToggle, onEdit, onDelete }: Props) {
  return (
    <article className={`todo-card${todo.isCompleted ? ' todo-card--done' : ''}`}>
      <label className="todo-card__check">
        <input
          type="checkbox"
          aria-label={todo.isCompleted ? '완료 취소' : '완료 처리'}
          checked={todo.isCompleted}
          onChange={() => onToggle(todo)}
        />
      </label>
      <div className="todo-card__body">
        <h3 className="todo-card__title">{todo.title}</h3>
        <div className="todo-card__meta">
          {category && <CategoryBadge name={category.name} colorCode={category.colorCode} />}
          {todo.dueDate && <span className="todo-card__due">~{todo.dueDate}</span>}
        </div>
      </div>
      {onEdit && (
        <button type="button" onClick={() => onEdit(todo)} className="todo-card__btn">
          수정
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(todo)}
          className="todo-card__btn todo-card__btn--danger"
        >
          삭제
        </button>
      )}
    </article>
  );
}
