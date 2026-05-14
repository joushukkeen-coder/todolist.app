import { create } from 'zustand';

type ModalName =
  | 'todoForm'
  | 'todoDelete'
  | 'categoryForm'
  | 'categoryDelete'
  | 'accountDelete'
  | null;

interface UiState {
  activeModal: ModalName;
  filterPanelOpen: boolean;
  openModal: (name: Exclude<ModalName, null>) => void;
  closeModal: () => void;
  toggleFilterPanel: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeModal: null,
  filterPanelOpen: false,
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
  toggleFilterPanel: () => set((s) => ({ filterPanelOpen: !s.filterPanelOpen })),
}));
