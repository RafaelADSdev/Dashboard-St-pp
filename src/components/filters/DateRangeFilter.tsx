'use client'

import clsx from 'clsx'
import { format } from 'date-fns'
import { useFilterStore } from '@/store/filterStore'
import { filterInputClass, filterLabelClass } from '@/components/ui/styles'

const presets = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
] as const

function getPresetRange(preset: (typeof presets)[number]['id']) {
  const today = format(new Date(), 'yyyy-MM-dd')

  if (preset === 'today') {
    return { dateFrom: today, dateTo: today }
  }

  if (preset === '7d') {
    const from = new Date()
    from.setDate(from.getDate() - 7)
    return { dateFrom: format(from, 'yyyy-MM-dd'), dateTo: today }
  }

  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { dateFrom: format(from, 'yyyy-MM-dd'), dateTo: today }
}

export function DateRangeFilter() {
  const { dateFrom, dateTo, setDateFrom, setDateTo, datesReady } = useFilterStore()

  if (!datesReady) {
    return (
      <div className="flex gap-3">
        <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-100" />
      </div>
    )
  }

  const activePreset = presets.find((preset) => {
    const range = getPresetRange(preset.id)
    return range.dateFrom === dateFrom && range.dateTo === dateTo
  })?.id

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              const range = getPresetRange(preset.id)
              setDateFrom(range.dateFrom)
              setDateTo(range.dateTo)
            }}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              activePreset === preset.id
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={filterLabelClass}>De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={filterInputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={filterLabelClass}>Até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={filterInputClass}
          />
        </div>
      </div>
    </div>
  )
}
