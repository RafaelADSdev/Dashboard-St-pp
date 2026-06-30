'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard, PanelLeftClose, PanelLeftOpen, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { StuppLogo } from '@/components/brand/StuppLogo'
import { useLayoutUiStore } from '@/store/layoutUiStore'

const navItems = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/esteira-economico', label: 'Comercial Econômico', icon: TrendingUp },
  { to: '/esteira-geral', label: 'Comercial Geral', icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname() ?? '/'
  const sidebarOpen = useLayoutUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useLayoutUiStore((s) => s.toggleSidebar)

  return (
    <aside
      className={clsx(
        'sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-out dark:border-slate-700 dark:bg-slate-900',
        sidebarOpen ? 'w-[260px]' : 'w-[72px]'
      )}
      aria-label="Menu de navegação"
    >
      <div
        className={clsx(
          'flex items-center border-b border-slate-100 dark:border-slate-800',
          sidebarOpen ? 'justify-between gap-2 p-4' : 'justify-center p-3'
        )}
      >
        {sidebarOpen ? (
          <>
            <Link href="/" className="block min-w-0 shrink" title="Superintendência Stüpp">
              <StuppLogo priority />
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={sidebarOpen}
              aria-label="Recolher menu"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-label="Expandir menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)

          return (
            <Link
              key={to}
              href={to}
              title={sidebarOpen ? undefined : label}
              className={clsx(
                'flex items-center rounded-lg text-sm font-medium transition-colors',
                sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center px-2 py-2.5',
                isActive
                  ? 'bg-blue-50 font-semibold text-blue-950 dark:bg-blue-950/50 dark:text-blue-100'
                  : 'text-blue-900 hover:bg-slate-50 hover:text-blue-950 dark:text-blue-300 dark:hover:bg-slate-800 dark:hover:text-blue-100'
              )}
            >
              <Icon
                className={clsx(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-blue-800 dark:text-blue-300' : 'text-blue-700 dark:text-blue-400'
                )}
              />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
