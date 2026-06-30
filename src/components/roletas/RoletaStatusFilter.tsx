'use client'

import clsx from 'clsx'
import type { RoletaOperationalStatus } from '@/api/types'
import { ROLETA_STATUS_LABELS } from '@/lib/roletaStatus'
import type { RoletaStatusFilter } from '@/utils/filterRoletas'

interface StatusOption {
  id: RoletaStatusFilter
  label: string
  count: number
}

interface Props {
  value: RoletaStatusFilter
  counts: Record<RoletaOperationalStatus, number>
  total: number
  onChange: (value: RoletaStatusFilter) => void
}

export function RoletaStatusFilter({ value, counts, total, onChange }: Props) {
  const options: StatusOption[] = [
    { id: 'todas', label: 'Todas', count: total },
    { id: 'ativa', label: ROLETA_STATUS_LABELS.ativa, count: counts.ativa },
    { id: 'nova', label: ROLETA_STATUS_LABELS.nova, count: counts.nova },
    { id: 'suspensa', label: ROLETA_STATUS_LABELS.suspensa, count: counts.suspensa },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.id

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              selected
                ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60'
            )}
          >
            <span>{option.label}</span>
            <span
              className={clsx(
                'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                selected
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              )}
            >
              {option.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
