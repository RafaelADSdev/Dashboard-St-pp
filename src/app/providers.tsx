'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import {
  STUPP_ORG_QUERY_KEY,
  STUPP_ROLETAS_QUERY_KEY,
} from '@/lib/queryKeys'
import { useFilterStore } from '@/store/filterStore'

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const isLogin = pathname === '/login'
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const initDates = useFilterStore((s) => s.initDates)

  useEffect(() => {
    if (isLogin) return

    initDates()

    void (async () => {
      await queryClient.prefetchQuery({
        queryKey: STUPP_ORG_QUERY_KEY,
        queryFn: async () => {
          const res = await fetch('/api/org')
          if (!res.ok) throw new Error('Erro ao carregar estrutura')
          return res.json()
        },
        staleTime: 1000 * 60 * 60 * 24,
        retry: 0,
      })

      if (pathname === '/acessos') return

      await new Promise((resolve) => setTimeout(resolve, 400))

      await queryClient.prefetchQuery({
        queryKey: STUPP_ROLETAS_QUERY_KEY,
        queryFn: async () => {
          const res = await fetch('/api/roletas')
          if (!res.ok) throw new Error('Erro ao carregar roletas')
          return res.json()
        },
        staleTime: 1000 * 60 * 60 * 24,
        retry: 0,
      })
    })()
  }, [initDates, queryClient, isLogin, pathname])

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}
