'use client'

import clsx from 'clsx'
import type { RoletaOperationalStatus } from '@/api/types'
import { ROLETA_STATUS_LABELS } from '@/lib/roletaStatus'
import type { RoletaStatusFilter } from '@/utils/filterRoletas'
import { roletaStatusFilterStyles } from './roletaStatusButtonStyles'

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
        const styles = roletaStatusFilterStyles[option.id]

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              selected ? styles.button.selected : styles.button.unselected
            )}
          >
            <span>{option.label}</span>
            <span
              className={clsx(
                'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                selected ? styles.badge.selected : styles.badge.unselected
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
