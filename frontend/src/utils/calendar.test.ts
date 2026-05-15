import { describe, test, expect } from 'vitest';
import { buildMonthGrid, extractIsoDate, formatYearMonth, shiftMonth, toIsoDate } from './calendar';

describe('toIsoDate', () => {
  test('지역 시각의 Y-M-D 반환', () => {
    expect(toIsoDate(new Date(2026, 4, 15))).toBe('2026-05-15');
    expect(toIsoDate(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
});

describe('extractIsoDate', () => {
  test('YYYY-MM-DD만 입력', () => {
    expect(extractIsoDate('2026-05-15')).toBe('2026-05-15');
  });
  test('타임스탬프에서 날짜만 추출', () => {
    expect(extractIsoDate('2026-05-15T00:00:00.000Z')).toBe('2026-05-15');
  });
  test('null/undefined → null', () => {
    expect(extractIsoDate(null)).toBeNull();
    expect(extractIsoDate(undefined)).toBeNull();
  });
});

describe('buildMonthGrid', () => {
  test('2026-05 (5월) → 42셀, 일요일 시작', () => {
    // 2026-05-01은 금요일이므로 셀[0]은 4월 26일(일).
    const cells = buildMonthGrid(2026, 4, new Date(2026, 4, 15));
    expect(cells).toHaveLength(42);
    expect(cells[0]!.isoDate).toBe('2026-04-26');
    expect(cells[0]!.isCurrentMonth).toBe(false);
    expect(cells[0]!.weekday).toBe(0);
    // 5/1은 첫 주 금요일 (인덱스 5)
    expect(cells[5]!.isoDate).toBe('2026-05-01');
    expect(cells[5]!.isCurrentMonth).toBe(true);
  });

  test('isToday 표시', () => {
    const cells = buildMonthGrid(2026, 4, new Date(2026, 4, 15));
    const today = cells.find((c) => c.isoDate === '2026-05-15');
    expect(today?.isToday).toBe(true);
  });
});

describe('shiftMonth', () => {
  test('+1 → 다음 달, -1 → 이전 달', () => {
    expect(shiftMonth(2026, 4, 1)).toEqual({ year: 2026, month: 5 });
    expect(shiftMonth(2026, 4, -1)).toEqual({ year: 2026, month: 3 });
  });
  test('연도 경계 (12월 → 1월)', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe('formatYearMonth', () => {
  test('zero-pad', () => {
    expect(formatYearMonth(2026, 4)).toBe('2026.05');
    expect(formatYearMonth(2026, 11)).toBe('2026.12');
  });
});
