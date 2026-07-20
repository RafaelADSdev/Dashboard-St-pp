import type { ReactNode } from 'react'
import { ViewSectionGuard } from '@/components/auth/ViewSectionGuard'

export const dynamic = 'force-dynamic'

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ViewSectionGuard>{children}</ViewSectionGuard>
}
