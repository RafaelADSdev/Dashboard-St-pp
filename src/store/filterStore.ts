import { create } from 'zustand'
import { subDays, format } from 'date-fns'

type Esteira = 'GERAL' | 'ECONOMICO' | 'TODAS'

export interface FilterValues {
  dateFrom: string
  dateTo: string
  diretoria: string
  equipe: string
  esteira: Esteira
}

function getDefaultDateRange() {
  return {
    dateFrom: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
  }
}

function defaultFilters(): FilterValues {
  return {
    ...getDefaultDateRange(),
    diretoria: '',
    equipe: '',
    esteira: 'TODAS',
  }
}

function pickDraft(state: FilterState): FilterValues {
  return {
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
    diretoria: state.diretoria,
    equipe: state.equipe,
    esteira: state.esteira,
  }
}

function filtersEqual(a: FilterValues, b: FilterValues, ignoreEsteira = false) {
  return (
    a.dateFrom === b.dateFrom &&
    a.dateTo === b.dateTo &&
    a.diretoria === b.diretoria &&
    a.equipe === b.equipe &&
    (ignoreEsteira || a.esteira === b.esteira)
  )
}

interface FilterState extends FilterValues {
  datesReady: boolean
  applied: FilterValues | null
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  setDiretoria: (v: string) => void
  setEquipe: (v: string) => void
  setEsteira: (v: Esteira) => void
  applyFilters: () => void
  initDates: () => void
  resetFilters: () => void
  hasPendingChanges: (ignoreEsteira?: boolean) => boolean
}

export const useFilterStore = create<FilterState>((set, get) => ({
  dateFrom: '',
  dateTo: '',
  diretoria: '',
  equipe: '',
  esteira: 'TODAS',
  datesReady: false,
  applied: null,
  setDateFrom: (v) => set({ dateFrom: v }),
  setDateTo: (v) => set({ dateTo: v }),
  setDiretoria: (v) => set({ diretoria: v, equipe: '' }),
  setEquipe: (v) => set({ equipe: v }),
  setEsteira: (v) => set({ esteira: v }),
  applyFilters: () => {
    const draft = pickDraft(get())
    set({ applied: draft })
  },
  initDates: () => {
    const defaults = defaultFilters()
    set({ ...defaults, datesReady: true, applied: defaults })
  },
  resetFilters: () => {
    const defaults = defaultFilters()
    set({ ...defaults, datesReady: true, applied: defaults })
  },
  hasPendingChanges: (ignoreEsteira = false) => {
    const { applied } = get()
    if (!applied) return false
    return !filtersEqual(pickDraft(get()), applied, ignoreEsteira)
  },
}))

export function useAppliedFilters() {
  return useFilterStore((s) => s.applied)
}
