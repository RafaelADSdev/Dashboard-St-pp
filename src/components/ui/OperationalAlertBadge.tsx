import clsx from 'clsx'
import type { OperationalAlert } from '@/utils/operationalAlert'

interface Props {
  alert: OperationalAlert
  size?: 'sm' | 'md'
  className?: string
}

export function OperationalAlertBadge({ alert, size = 'sm', className }: Props) {
  if (alert.level === 'ok') return null

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center rounded-md font-semibold tabular-nums ring-1 ring-inset',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        alert.badgeClass,
        className
      )}
      title={alert.title}
      aria-label={alert.title}
    >
      {alert.shortLabel}
    </span>
  )
}
