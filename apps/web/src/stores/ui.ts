import { create } from 'zustand';

interface UIState {
  selectedFileId: string | null;
  selectedNodeId: string | null;
  graphView: 'modules' | 'files' | 'functions' | 'classes';
  paletteOpen: boolean;
  setSelectedFileId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setGraphView: (v: UIState['graphView']) => void;
  togglePalette: () => void;
}

export const useUI = create<UIState>((set) => ({
  selectedFileId: null,
  selectedNodeId: null,
  graphView: 'files',
  paletteOpen: false,
  setSelectedFileId: (id) => set({ selectedFileId: id }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setGraphView: (v) => set({ graphView: v }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
}));
