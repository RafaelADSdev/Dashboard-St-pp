import clsx from 'clsx'
import { Check, Loader2 } from 'lucide-react'
import { useFilterStore, type FilterValues } from '@/store/filterStore'

interface Props {
  ignoreEsteira?: boolean
  onApply?: () => void
}

function pickDraft(state: {
  dateFrom: string
  dateTo: string
  diretoria: string
  equipe: string
  corretor: string
  roleta: string
  esteira: FilterValues['esteira']
}): FilterValues {
  return {
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
    diretoria: state.diretoria,
    equipe: state.equipe,
    corretor: state.corretor,
    roleta: state.roleta,
    esteira: state.esteira,
  }
}

function filtersEqual(a: FilterValues, b: FilterValues, ignoreEsteira = false) {
  return (
    a.dateFrom === b.dateFrom &&
    a.dateTo === b.dateTo &&
    a.diretoria === b.diretoria &&
    a.equipe === b.equipe &&
    a.corretor === b.corretor &&
    a.roleta === b.roleta &&
    (ignoreEsteira || a.esteira === b.esteira)
  )
}

export function ApplyFiltersButton({ ignoreEsteira = false, onApply }: Props) {
  const applyFilters = useFilterStore((s) => s.applyFilters)
  const isApplying = useFilterStore((s) => s.isApplying)
  const datesReady = useFilterStore((s) => s.datesReady)
  const hasPending = useFilterStore((s) => {
    if (!s.applied) return false
    return !filtersEqual(pickDraft(s), s.applied, ignoreEsteira)
  })

  const isLoading = isApplying
  const canApply = datesReady && hasPending && !isLoading

  return (
    <button
      type="button"
      onClick={() => {
        applyFilters()
        onApply?.()
      }}
      disabled={!canApply && !isLoading}
      className={clsx(
        'inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
        isLoading
          ? 'bg-blue-800 text-white cursor-wait'
          : canApply
            ? 'bg-blue-900 text-white hover:bg-blue-950'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Check className="w-4 h-4" />
      )}
      {isLoading ? 'Aplicando...' : 'Aplicar filtros'}
    </button>
  )
}
