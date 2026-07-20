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
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 border-b border-indigo/10 bg-[#f5f5f5]/95 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-indigo/80 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <button
          type="button"
          onClick={toggleFilters}
          aria-expanded={filtersOpen}
          className={clsx(
            'relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            filtersOpen || hasActiveFilters
              ? 'bg-black/6 text-indigo dark:bg-sidebar-active dark:text-cream'
              : 'text-indigo/80 hover:bg-black/5 hover:text-indigo dark:text-cream/80 dark:hover:bg-sidebar-hover dark:hover:text-cream'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {(hasPending || hasActiveFilters) && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-2 ring-[#f5f5f5] dark:ring-indigo" />
          )}
        </button>
        <ExportButton />
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-brand-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-indigo/70 transition-colors hover:bg-black/5 hover:text-indigo dark:text-cream/70 dark:hover:bg-sidebar-hover dark:hover:text-cream"
          title="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
