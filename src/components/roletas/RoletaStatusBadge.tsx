import clsx from 'clsx'
import type { RoletaOperationalStatus } from '@/api/types'
import { ROLETA_STATUS_LABELS } from '@/lib/roletaStatus'
import { roletaStatusBadgeStyles } from './roletaStatusButtonStyles'

interface Props {
  status: RoletaOperationalStatus
  showDot?: boolean
}

export function RoletaStatusBadge({ status, showDot = true }: Props) {
  const style = roletaStatusBadgeStyles[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        style.badge
      )}
    >
      {showDot && <span className={clsx('h-1.5 w-1.5 rounded-full', style.dot)} />}
      {ROLETA_STATUS_LABELS[status]}
    </span>
  )
}
