'use client'

import clsx from 'clsx'
import type { TooltipContentProps } from 'recharts'
import {
  chartTooltipBody,
  chartTooltipMuted,
  chartTooltipSurface,
  chartTooltipTitle,
  chartTooltipValue,
} from '@/components/charts/chartUi'

export function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null

  return (
    <div className={chartTooltipSurface}>
      {label != null && String(label).length > 0 && (
        <p className={clsx('mb-1.5', chartTooltipTitle)}>{label}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.name ?? entry.dataKey)} className={clsx('flex items-center gap-2', chartTooltipBody)}>
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? '#6c757d' }}
            />
            <span className={chartTooltipMuted}>
              {entry.name}: <span className={chartTooltipValue}>{entry.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
