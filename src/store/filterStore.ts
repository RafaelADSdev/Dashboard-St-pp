import { create } from 'zustand'
import { subDays, format } from 'date-fns'

type Esteira = 'GERAL' | 'ECONOMICO' | 'TODAS'

interface FilterState {
  dateFrom: string
  dateTo: string
  diretoria: string
  equipe: string
  esteira: Esteira
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  setDiretoria: (v: string) => void
  setEquipe: (v: string) => void
  setEsteira: (v: Esteira) => void
  resetFilters: () => void
}

const today = format(new Date(), 'yyyy-MM-dd')
const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')

export const useFilterStore = create<FilterState>((set) => ({
  dateFrom: sevenDaysAgo,
  dateTo: today,
  diretoria: '',
  equipe: '',
  esteira: 'TODAS',
  setDateFrom: (v) => set({ dateFrom: v }),
  setDateTo: (v) => set({ dateTo: v }),
  setDiretoria: (v) => set({ diretoria: v }),
  setEquipe: (v) => set({ equipe: v }),
  setEsteira: (v) => set({ esteira: v }),
  resetFilters: () =>
    set({
      dateFrom: sevenDaysAgo,
      dateTo: today,
      diretoria: '',
      equipe: '',
      esteira: 'TODAS',
    }),
}))
