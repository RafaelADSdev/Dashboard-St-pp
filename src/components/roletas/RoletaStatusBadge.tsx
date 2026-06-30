import clsx from 'clsx'
import type { RoletaOperationalStatus } from '@/api/types'
import { ROLETA_STATUS_LABELS } from '@/lib/roletaStatus'

const variants: Record<
  RoletaOperationalStatus,
  { badge: string; dot: string }
> = {
  ativa: {
    badge:
      'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  nova: {
    badge:
      'bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/30',
    dot: 'bg-brand-500',
  },
  suspensa: {
    badge:
      'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:ring-slate-600/50',
    dot: 'bg-slate-400',
  },
}

interface Props {
  status: RoletaOperationalStatus
  showDot?: boolean
}

export function RoletaStatusBadge({ status, showDot = true }: Props) {
  const style = variants[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1',
        style.badge
      )}
    >
      {showDot && <span className={clsx('h-1.5 w-1.5 rounded-full', style.dot)} />}
      {ROLETA_STATUS_LABELS[status]}
    </span>
  )
}
