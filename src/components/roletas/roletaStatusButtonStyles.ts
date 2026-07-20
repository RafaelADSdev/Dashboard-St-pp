import type { RoletaOperationalStatus } from '@/api/types'
import type { RoletaStatusFilter } from '@/utils/filterRoletas'

export type StatusButtonStyles = {
  button: { selected: string; unselected: string }
  badge: { selected: string; unselected: string }
}

export const roletaOperationalStatusStyles: Record<RoletaOperationalStatus, StatusButtonStyles> = {
  ativa: {
    button: {
      selected:
        'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200',
      unselected:
        'border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/8 dark:text-emerald-300 dark:hover:bg-emerald-500/12',
    },
    badge: {
      selected: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-100',
      unselected: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
  },
  nova: {
    button: {
      selected:
        'border-amber-300 bg-amber-50 text-amber-900 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200',
      unselected:
        'border-amber-200 bg-amber-50/60 text-amber-800 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/8 dark:text-amber-300 dark:hover:bg-amber-500/12',
    },
    badge: {
      selected: 'bg-amber-100 text-amber-900 dark:bg-amber-500/25 dark:text-amber-100',
      unselected: 'bg-amber-100/80 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    },
  },
  suspensa: {
    button: {
      selected:
        'border-rose-300 bg-rose-50 text-rose-800 shadow-sm dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200',
      unselected:
        'border-rose-200 bg-rose-50/60 text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-500/25 dark:bg-rose-500/8 dark:text-rose-300 dark:hover:bg-rose-500/12',
    },
    badge: {
      selected: 'bg-rose-100 text-rose-800 dark:bg-rose-500/25 dark:text-rose-100',
      unselected: 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    },
  },
}

export const roletaStatusFilterStyles: Record<RoletaStatusFilter, StatusButtonStyles> = {
  todas: {
    button: {
      selected:
        'border-indigo/35 bg-indigo/12 text-indigo shadow-sm dark:border-indigo-300/35 dark:bg-indigo-300/15 dark:text-indigo-100',
      unselected:
        'border-indigo/15 bg-indigo/5 text-indigo/80 hover:border-indigo/25 hover:bg-indigo/10 dark:border-indigo-300/20 dark:bg-indigo-300/8 dark:text-indigo-200 dark:hover:bg-indigo-300/12',
    },
    badge: {
      selected: 'bg-indigo/15 text-indigo dark:bg-indigo-300/20 dark:text-indigo-50',
      unselected: 'bg-indigo/10 text-indigo/70 dark:bg-indigo-300/12 dark:text-indigo-200',
    },
  },
  ...roletaOperationalStatusStyles,
}

export const roletaStatusDotStyles: Record<RoletaOperationalStatus, string> = {
  ativa: 'bg-emerald-500',
  nova: 'bg-amber-500',
  suspensa: 'bg-rose-400',
}
