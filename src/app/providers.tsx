'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
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
    void queryClient.prefetchQuery({
      queryKey: ['stupp-org'],
      queryFn: async () => {
        const res = await fetch('/api/org')
        if (!res.ok) throw new Error('Erro ao carregar estrutura')
        return res.json()
      },
      staleTime: 1000 * 60 * 60 * 24,
    })
    void queryClient.prefetchQuery({
      queryKey: ['stupp-roletas'],
      queryFn: async () => {
        const res = await fetch('/api/roletas')
        if (!res.ok) throw new Error('Erro ao carregar roletas')
        const data = await res.json()
        return data.roletas
      },
      staleTime: 1000 * 60 * 60 * 24,
    })
  }, [initDates, queryClient, isLogin])

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}
