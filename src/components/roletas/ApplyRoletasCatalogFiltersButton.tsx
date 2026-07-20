'use client'

import clsx from 'clsx'
import { Check } from 'lucide-react'
import type { RoletaStatusFilter } from '@/utils/filterRoletas'

export interface RoletasCatalogFilters {
  diretoriaId: string
  liderancaId: string
  corretorId: string
  roletaId: string
  status: RoletaStatusFilter
}

export const EMPTY_ROLETAS_CATALOG_FILTERS: RoletasCatalogFilters = {
  diretoriaId: '',
  liderancaId: '',
  corretorId: '',
  roletaId: '',
  status: 'ativa',
}

export function roletasCatalogFiltersEqual(
  a: RoletasCatalogFilters,
  b: RoletasCatalogFilters
): boolean {
  return (
    a.diretoriaId === b.diretoriaId &&
    a.liderancaId === b.liderancaId &&
    a.corretorId === b.corretorId &&
    a.roletaId === b.roletaId &&
    a.status === b.status
  )
}

interface Props {
  draft: RoletasCatalogFilters
  applied: RoletasCatalogFilters
  onApply: () => void
}

export function ApplyRoletasCatalogFiltersButton({ draft, applied, onApply }: Props) {
  const hasPending = !roletasCatalogFiltersEqual(draft, applied)

  return (
    <button
      type="button"
      onClick={onApply}
      disabled={!hasPending}
      className={clsx(
        'inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all sm:w-auto sm:min-w-[200px]',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
        hasPending
          ? 'bg-brand-600 text-cream shadow-sm hover:bg-brand-700'
          : 'cursor-not-allowed border border-indigo/10 bg-indigo/5 text-indigo/40 dark:border-cream/10 dark:bg-cream/5 dark:text-cream/35'
      )}
    >
      <Check className="h-4 w-4" />
      Aplicar filtros
    </button>
  )
}
