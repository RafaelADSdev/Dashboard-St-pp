'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import {
  canViewSection,
  getDefaultLandingPath,
  pathnameToViewSection,
} from '@/lib/viewSections'

export function ViewSectionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const { data: profile, isLoading } = useCurrentProfile()

  useEffect(() => {
    if (isLoading || !profile) return

    if (pathname.startsWith('/acessos')) {
      if (!profile.isAdmin) {
        router.replace(getDefaultLandingPath(profile))
      }
      return
    }

    const section = pathnameToViewSection(pathname)
    if (!section) return

    if (!canViewSection(profile, section)) {
      router.replace(getDefaultLandingPath(profile))
    }
  }, [isLoading, pathname, profile, router])

  return children
}
