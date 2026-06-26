'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { useFilterStore } from '@/store/filterStore'

export function Providers({ children }: { children: ReactNode }) {
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
  }, [initDates, queryClient])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
