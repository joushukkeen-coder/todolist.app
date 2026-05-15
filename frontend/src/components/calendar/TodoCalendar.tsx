import { useMemo } from 'react';
import type { Todo } from '@/types/todo.types';
import {
  buildMonthGrid,
  extractIsoDate,
  WEEKDAY_EN,
  WEEKDAY_JA,
  WEEKDAY_KO,
} from '@/utils/calendar';
import { useTranslation } from '@/hooks/useLanguage';
import './TodoCalendar.css';

interface Props {
  year: number;
  month: number; // 0~11
  todos: Todo[];
  onTodoClick?: (todo: Todo) => void;
  onCellClick?: (isoDate: string) => void;
}

const MAX_TITLES_PER_CELL = 3;

export default function TodoCalendar({ year, month, todos, onTodoClick, onCellClick }: Props) {
  const { language } = useTranslation();
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const byDate = useMemo(() => {
    const map = new Map<string, Todo[]>();
    for (const t of todos) {
      const key = extractIsoDate(t.dueDate);
      if (!key) continue;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [todos]);

  const weekdays = language === 'en' ? WEEKDAY_EN : language === 'ja' ? WEEKDAY_JA : WEEKDAY_KO;

  return (
    <div className="todo-calendar" role="grid" aria-label="할일 캘린더">
      <div className="todo-calendar__weekrow" role="row">
        {weekdays.map((w, i) => (
          <div
            key={w}
            className={
              'todo-calendar__weekday' +
              (i === 0 ? ' todo-calendar__weekday--sun' : '') +
              (i === 6 ? ' todo-calendar__weekday--sat' : '')
            }
            role="columnheader"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="todo-calendar__grid">
        {cells.map((cell) => {
          const items = byDate.get(cell.isoDate) ?? [];
          const dayNumber = cell.date.getDate();
          const dayClasses = [
            'todo-calendar__cell',
            cell.isCurrentMonth ? '' : 'todo-calendar__cell--other',
            cell.isToday ? 'todo-calendar__cell--today' : '',
            cell.weekday === 0 ? 'todo-calendar__cell--sun' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={cell.isoDate}
              type="button"
              className={dayClasses}
              role="gridcell"
              aria-label={cell.isoDate}
              onClick={() => onCellClick?.(cell.isoDate)}
            >
              <span className="todo-calendar__day">{dayNumber}</span>
              <ul className="todo-calendar__events">
                {items.slice(0, MAX_TITLES_PER_CELL).map((t) => (
                  <li key={t.todoId}>
                    <span
                      className={
                        'todo-calendar__event' +
                        (t.isCompleted ? ' todo-calendar__event--done' : '')
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onTodoClick?.(t);
                      }}
                      title={t.title}
                    >
                      {t.title}
                    </span>
                  </li>
                ))}
                {items.length > MAX_TITLES_PER_CELL && (
                  <li className="todo-calendar__more">+{items.length - MAX_TITLES_PER_CELL}</li>
                )}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
