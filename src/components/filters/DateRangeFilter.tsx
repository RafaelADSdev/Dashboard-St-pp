import { useFilterStore } from '@/store/filterStore'
import { filterInputClass, filterLabelClass } from '@/components/ui/styles'

export function DateRangeFilter() {
  const { dateFrom, dateTo, setDateFrom, setDateTo, datesReady } = useFilterStore()

  if (!datesReady) {
    return (
      <div className="flex gap-3">
        <div className="h-9 w-36 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-9 w-36 rounded-lg bg-slate-100 animate-pulse" />
      </div>
    )
  }

  return (
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
  )
}
