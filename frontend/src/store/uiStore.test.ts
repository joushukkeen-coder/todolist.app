import { describe, test, expect, beforeEach } from 'vitest';
import { useUiStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ activeModal: null, filterPanelOpen: false });
  });

  test('초기 상태', () => {
    const s = useUiStore.getState();
    expect(s.activeModal).toBeNull();
    expect(s.filterPanelOpen).toBe(false);
  });

  test('openModal → activeModal 설정, closeModal → null', () => {
    useUiStore.getState().openModal('todoForm');
    expect(useUiStore.getState().activeModal).toBe('todoForm');
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().activeModal).toBeNull();
  });

  test('toggleFilterPanel 토글', () => {
    useUiStore.getState().toggleFilterPanel();
    expect(useUiStore.getState().filterPanelOpen).toBe(true);
    useUiStore.getState().toggleFilterPanel();
    expect(useUiStore.getState().filterPanelOpen).toBe(false);
  });
});
