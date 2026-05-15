export interface CalendarCell {
  date: Date;
  isoDate: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  weekday: number; // 0=일, 6=토
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD 형식의 문자열만 추출 (타임스탬프 ISO 문자열도 처리). */
export function extractIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return m ? m[1]! : null;
}

/** 일요일을 첫 컬럼으로 하는 6주 × 7일 = 42 셀 배열을 만든다. */
export function buildMonthGrid(
  year: number,
  month: number,
  today: Date = new Date(),
): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0=일
  const gridStart = new Date(year, month, 1 - startWeekday);

  const todayIso = toIsoDate(today);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      date: d,
      isoDate: toIsoDate(d),
      isCurrentMonth: d.getMonth() === month,
      isToday: toIsoDate(d) === todayIso,
      weekday: d.getDay(),
    });
  }
  return cells;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}.${String(month + 1).padStart(2, '0')}`;
}

export const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;
export const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'] as const;
