import { describe, test, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

beforeEach(() => useUIStore.setState({ activeModal: null, filterPanelOpen: false }));

describe('uiStore', () => {
  test('초기값: 모달 닫힘, 필터패널 닫힘', () => {
    const s = useUIStore.getState();
    expect(s.activeModal).toBeNull();
    expect(s.filterPanelOpen).toBe(false);
  });

  test('openModal/closeModal 동작', () => {
    useUIStore.getState().openModal('todoForm');
    expect(useUIStore.getState().activeModal).toBe('todoForm');
    useUIStore.getState().closeModal();
    expect(useUIStore.getState().activeModal).toBeNull();
  });

  test('toggleFilterPanel 토글', () => {
    useUIStore.getState().toggleFilterPanel();
    expect(useUIStore.getState().filterPanelOpen).toBe(true);
    useUIStore.getState().toggleFilterPanel();
    expect(useUIStore.getState().filterPanelOpen).toBe(false);
  });
});
