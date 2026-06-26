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
  }, [initDates])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
