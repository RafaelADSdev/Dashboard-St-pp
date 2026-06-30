'use client'

import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { ApplyFiltersButton } from '@/components/filters/ApplyFiltersButton'
import { useFilterStore } from '@/store/filterStore'
import { useLayoutUiStore } from '@/store/layoutUiStore'

interface FilterPanelProps {
  children: ReactNode
  ignoreEsteira?: boolean
}

function setBodyScrollLocked(locked: boolean) {
  document.body.style.overflow = locked ? 'hidden' : ''
}

export function FilterPanel({ children, ignoreEsteira = false }: FilterPanelProps) {
  const pathname = usePathname() ?? '/'
  const filtersOpen = useLayoutUiStore((s) => s.filtersOpen)
  const setFiltersOpen = useLayoutUiStore((s) => s.setFiltersOpen)
  const closeAll = useLayoutUiStore((s) => s.closeAll)
  const resetFilters = useFilterStore((s) => s.resetFilters)

  useEffect(() => {
    setFiltersOpen(false)
  }, [pathname, setFiltersOpen])

  useEffect(() => {
    if (!filtersOpen) {
      setBodyScrollLocked(false)
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false)
    }

    setBodyScrollLocked(true)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      setBodyScrollLocked(false)
    }
  }, [filtersOpen, setFiltersOpen])

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-200',
          filtersOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setFiltersOpen(false)}
        aria-hidden={!filtersOpen}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out dark:border-slate-700 dark:bg-slate-900',
          filtersOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
        aria-hidden={!filtersOpen}
        aria-label="Painel de filtros"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Filtros</span>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Fechar filtros"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-5 [&_select]:w-full [&_input]:w-full">{children}</div>
        </div>

        <div className="space-y-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar filtros
          </button>
          <ApplyFiltersButton
            ignoreEsteira={ignoreEsteira}
            onApply={() => closeAll()}
          />
        </div>
      </aside>
    </>
  )
}
