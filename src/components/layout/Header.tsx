'use client'

import { LogOut, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { useFilterStore } from '@/store/filterStore'
import { useLayoutUiStore } from '@/store/layoutUiStore'
import { ExportButton } from './ExportButton'

function useFilterIndicators(ignoreEsteira = false) {
  const applied = useFilterStore((s) => s.applied)
  const hasPending = useFilterStore((s) => s.hasPendingChanges(ignoreEsteira))

  const hasActiveFilters = Boolean(
    applied &&
      (applied.diretoria ||
        applied.equipe ||
        applied.roleta ||
        (!ignoreEsteira && applied.esteira !== 'TODAS'))
  )

  return { hasPending, hasActiveFilters }
}

export function Header() {
  const pathname = usePathname() ?? '/'
  const queryClient = useQueryClient()
  const toggleFilters = useLayoutUiStore((s) => s.toggleFilters)
  const filtersOpen = useLayoutUiStore((s) => s.filtersOpen)
  const { hasPending, hasActiveFilters } = useFilterIndicators(pathname !== '/')

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['stupp-org'] })
    queryClient.invalidateQueries({ queryKey: ['stupp-roletas'] })
  }

  const handleLogout = () => {
    window.location.assign('/auth/logout')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/80 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <button
          type="button"
          onClick={toggleFilters}
          aria-expanded={filtersOpen}
          className={clsx(
            'relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            filtersOpen || hasActiveFilters
              ? 'bg-blue-50 text-blue-950 dark:bg-blue-950/50 dark:text-blue-100'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {(hasPending || hasActiveFilters) && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>
        <ExportButton />
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-950"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
