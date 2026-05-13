import { create } from 'zustand';

type ModalName = 'todoForm' | 'categoryForm' | 'confirmDelete' | null;

interface UIState {
  activeModal: ModalName;
  filterPanelOpen: boolean;
  openModal: (name: Exclude<ModalName, null>) => void;
  closeModal: () => void;
  toggleFilterPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  filterPanelOpen: false,
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
  toggleFilterPanel: () => set((s) => ({ filterPanelOpen: !s.filterPanelOpen })),
}));
