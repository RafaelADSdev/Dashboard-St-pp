'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard, PanelLeftClose, PanelLeftOpen, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
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
        'sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-out',
        sidebarOpen ? 'w-[260px]' : 'w-[72px]'
      )}
      aria-label="Menu de navegação"
    >
      <div
        className={clsx(
          'flex items-center border-b border-slate-100',
          sidebarOpen ? 'justify-between gap-2 p-4' : 'justify-center p-3'
        )}
      >
        {sidebarOpen ? (
          <>
            <Link href="/" className="block min-w-0 shrink" title="Superintendência Stüpp">
              <Image
                src="/stupp-logo.png"
                alt="Superintendência Stüpp"
                width={140}
                height={40}
                priority
                className="h-9 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={sidebarOpen}
              aria-label="Recolher menu"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
                  ? 'bg-blue-50 font-semibold text-blue-950'
                  : 'text-blue-900 hover:bg-slate-50 hover:text-blue-950'
              )}
            >
              <Icon
                className={clsx(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-blue-800' : 'text-blue-700'
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
