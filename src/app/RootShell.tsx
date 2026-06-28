'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Providers } from './providers'

export function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const isLogin = pathname === '/login'

  return (
    <div className="min-h-screen">
      <Providers>
        {isLogin ? children : <DashboardLayout>{children}</DashboardLayout>}
      </Providers>
    </div>
  )
}
