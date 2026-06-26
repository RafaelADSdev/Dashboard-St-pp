'use client'

import { RefreshCw, RotateCcw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useFilterStore } from '@/store/filterStore'

export function Header() {
  const queryClient = useQueryClient()
  const resetFilters = useFilterStore((s) => s.resetFilters)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['stupp-org'] })
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 lg:px-8 py-3 flex items-center justify-end gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar filtros
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>
    </header>
  )
}
