import { create } from 'zustand'
import { subDays, format } from 'date-fns'

type Esteira = 'GERAL' | 'ECONOMICO' | 'TODAS'

function getDefaultDateRange() {
  return {
    dateFrom: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
  }
}

interface FilterState {
  dateFrom: string
  dateTo: string
  diretoria: string
  equipe: string
  esteira: Esteira
  datesReady: boolean
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  setDiretoria: (v: string) => void
  setEquipe: (v: string) => void
  setEsteira: (v: Esteira) => void
  initDates: () => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  dateFrom: '',
  dateTo: '',
  diretoria: '',
  equipe: '',
  esteira: 'TODAS',
  datesReady: false,
  setDateFrom: (v) => set({ dateFrom: v }),
  setDateTo: (v) => set({ dateTo: v }),
  setDiretoria: (v) => set({ diretoria: v }),
  setEquipe: (v) => set({ equipe: v }),
  setEsteira: (v) => set({ esteira: v }),
  initDates: () => set({ ...getDefaultDateRange(), datesReady: true }),
  resetFilters: () =>
    set({
      ...getDefaultDateRange(),
      datesReady: true,
      diretoria: '',
      equipe: '',
      esteira: 'TODAS',
    }),
}))
