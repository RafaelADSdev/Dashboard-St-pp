'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, CircleDot, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Shield, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { StuppLogo } from '@/components/brand/StuppLogo'
import { HubOnLogo } from '@/components/brand/HubOnLogo'
import { useLayoutUiStore } from '@/store/layoutUiStore'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'

const navItems = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/esteira-economico', label: 'Comercial Econômico', icon: TrendingUp },
  { to: '/esteira-geral', label: 'Comercial Geral', icon: Building2 },
  { to: '/roletas', label: 'Roletas', icon: CircleDot },
]

const adminNavItems = [{ to: '/acessos', label: 'Gestão de acesso', icon: Shield }]

export function Sidebar() {
  const pathname = usePathname() ?? '/'
  const sidebarOpen = useLayoutUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useLayoutUiStore((s) => s.toggleSidebar)
  const { data: profile } = useCurrentProfile()

  const items = profile?.isAdmin ? [...navItems, ...adminNavItems] : navItems

  return (
    <aside
      className={clsx(
        'sticky top-0 flex h-screen shrink-0 flex-col border-r border-indigo/10 bg-[#f5f5f5] text-indigo transition-[width] duration-200 ease-out dark:border-indigo-light dark:bg-sidebar dark:text-cream',
        sidebarOpen ? 'w-[260px]' : 'w-[72px]'
      )}
      aria-label="Menu de navegação"
    >
      <div
        className={clsx(
          'flex items-center border-b border-indigo/10 dark:border-white/10',
          sidebarOpen ? 'justify-between gap-2 p-4' : 'justify-center p-3'
        )}
      >
        {sidebarOpen ? (
          <>
            <Link href="/" className="flex min-w-0 shrink items-center gap-3" title="Superintendência Stüpp">
              <StuppLogo priority className="h-8 w-auto shrink-0" />
              <div className="h-8 w-px shrink-0 bg-indigo/15 dark:bg-white/15" aria-hidden />
              <HubOnLogo priority className="h-8 w-auto max-h-8 shrink-0 opacity-90" />
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={sidebarOpen}
              aria-label="Recolher menu"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-indigo/70 transition-colors hover:bg-black/5 hover:text-indigo dark:text-cream/70 dark:hover:bg-sidebar-hover dark:hover:text-cream"
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-indigo/70 transition-colors hover:bg-black/5 hover:text-indigo dark:text-cream/70 dark:hover:bg-sidebar-hover dark:hover:text-cream"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ to, label, icon: Icon }) => {
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
                  ? 'bg-black/6 font-semibold text-indigo dark:bg-sidebar-active dark:text-cream'
                  : 'text-indigo/75 hover:bg-black/5 hover:text-indigo dark:text-cream/75 dark:hover:bg-sidebar-hover dark:hover:text-cream'
              )}
            >
              <Icon
                className={clsx(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-indigo dark:text-cream' : 'text-indigo/70 dark:text-cream/70'
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
