'use client'

import type { ReactNode } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Providers } from './providers'

export function RootShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Providers>
        <DashboardLayout>{children}</DashboardLayout>
      </Providers>
    </div>
  )
}
