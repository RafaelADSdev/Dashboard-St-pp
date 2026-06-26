'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/esteira-economico', label: 'Comercial Econômico', icon: TrendingUp },
  { to: '/esteira-geral', label: 'Comercial Geral', icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname() ?? '/'

  return (
    <aside className="w-[260px] shrink-0 bg-white min-h-screen flex flex-col border-r border-slate-200">
      <div className="p-6 border-b border-slate-100">
        <Link href="/" className="block">
          <Image
            src="/stupp-logo.png"
            alt="Superintendência Stüpp"
            width={140}
            height={40}
            priority
            className="h-9 w-auto"
          />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)

          return (
            <Link
              key={to}
              href={to}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-950 font-semibold'
                  : 'text-blue-900 hover:bg-slate-50 hover:text-blue-950'
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 shrink-0',
                  isActive ? 'text-blue-800' : 'text-blue-700'
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
