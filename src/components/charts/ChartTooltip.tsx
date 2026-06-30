'use client'

import type { TooltipContentProps } from 'recharts'

export function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg">
      {label != null && String(label).length > 0 && (
        <p className="mb-1.5 text-sm font-semibold text-slate-900">{label}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.name ?? entry.dataKey)} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? '#64748b' }}
            />
            <span className="text-slate-600">
              {entry.name}:{' '}
              <span className="font-semibold text-slate-900">{entry.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
