import { SlidersHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'

export function FilterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
        <SlidersHorizontal className="w-4 h-4 text-brand-500" />
        <span className="text-sm font-semibold text-slate-700">Filtros</span>
      </div>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-4">{children}</div>
    </div>
  )
}
