import clsx from 'clsx'
import { Check } from 'lucide-react'
import { useFilterStore, type FilterValues } from '@/store/filterStore'

interface Props {
  ignoreEsteira?: boolean
}

function pickDraft(state: {
  dateFrom: string
  dateTo: string
  diretoria: string
  equipe: string
  esteira: FilterValues['esteira']
}): FilterValues {
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

export function ApplyFiltersButton({ ignoreEsteira = false }: Props) {
  const applyFilters = useFilterStore((s) => s.applyFilters)
  const datesReady = useFilterStore((s) => s.datesReady)
  const hasPending = useFilterStore((s) => {
    if (!s.applied) return false
    return !filtersEqual(pickDraft(s), s.applied, ignoreEsteira)
  })

  return (
    <button
      type="button"
      onClick={applyFilters}
      disabled={!datesReady || !hasPending}
      className={clsx(
        'inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
        hasPending
          ? 'bg-blue-900 text-white hover:bg-blue-950'
          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
      )}
    >
      <Check className="w-4 h-4" />
      Aplicar filtros
    </button>
  )
}
