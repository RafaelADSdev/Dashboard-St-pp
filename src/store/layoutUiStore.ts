import { create } from 'zustand'

interface LayoutUiState {
  sidebarOpen: boolean
  filtersOpen: boolean
  setSidebarOpen: (open: boolean) => void
  setFiltersOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleFilters: () => void
  closeAll: () => void
}

export const useLayoutUiStore = create<LayoutUiState>((set) => ({
  sidebarOpen: true,
  filtersOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setFiltersOpen: (open) => set({ filtersOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleFilters: () => set((state) => ({ filtersOpen: !state.filtersOpen })),
  closeAll: () => set({ filtersOpen: false }),
}))
