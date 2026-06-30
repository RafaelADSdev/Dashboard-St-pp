'use client'

import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import type { LeadsDashboardData, StuppRoletaOption } from '@/api/types'
import type { OrgPreview } from '@/lib/orgPreview'
import { useAppliedFilters } from '@/store/filterStore'
import {
  buildExportContext,
  mergeFiltersForPage,
} from '@/utils/exportDashboard'
import { exportDashboardExcel, exportDashboardPdf } from '@/utils/exportDashboardFiles'

export function ExportButton() {
  const pathname = usePathname() ?? '/'
  const queryClient = useQueryClient()
  const applied = useAppliedFilters()
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!applied?.dateFrom || !applied?.dateTo) {
      window.alert('Aguarde os filtros carregarem antes de exportar.')
      return
    }

    const merged = mergeFiltersForPage(pathname, applied)
    const data = queryClient.getQueryData<LeadsDashboardData>(['leads', merged])

    if (!data) {
      window.alert('Não há dados carregados para exportar. Aguarde o dashboard terminar de carregar.')
      return
    }

    const org = queryClient.getQueryData<OrgPreview>(['stupp-org'])
    const catalog = queryClient.getQueryData<{ roletas: StuppRoletaOption[] }>(['stupp-roletas'])
    const roletas = catalog?.roletas

    setExporting(format)
    setOpen(false)

    try {
      const ctx = buildExportContext(pathname, applied, data, org, roletas)

      if (format === 'excel') {
        await exportDashboardExcel(ctx)
      } else {
        await exportDashboardPdf(ctx)
      }
    } catch (error) {
      console.error(error)
      window.alert('Não foi possível exportar o relatório. Tente novamente.')
    } finally {
      setExporting(null)
    }
  }

  const isBusy = exporting !== null

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={isBusy}
        aria-expanded={open}
        aria-haspopup="menu"
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          open || isBusy
            ? 'bg-blue-50 text-blue-950 dark:bg-blue-950/50 dark:text-blue-100'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
          isBusy && 'cursor-wait'
        )}
      >
        {isBusy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{isBusy ? 'Exportando...' : 'Exportar'}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleExport('excel')}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Excel (.xlsx)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleExport('pdf')}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FileText className="h-4 w-4 text-red-600" />
            PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  )
}
