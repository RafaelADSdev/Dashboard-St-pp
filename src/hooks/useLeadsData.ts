import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { FilterParams, LeadsDashboardData } from '@/api/types'
import { DASHBOARD_SYNC_MS } from '@/lib/syncConfig'

async function fetchDashboard(filters: FilterParams): Promise<LeadsDashboardData> {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    esteira: filters.esteira,
    diretoria: filters.diretoria,
    equipe: filters.equipe,
  })

  const res = await fetch(`/api/dashboard?${params.toString()}`)

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Erro ao carregar dados do dashboard')
  }

  return res.json()
}

export function useLeadsData(
  filters: FilterParams | null,
  overrides?: Partial<FilterParams>
) {
  const merged = filters ? { ...filters, ...overrides } : null

  return useQuery({
    queryKey: ['leads', merged],
    enabled: Boolean(merged?.dateFrom && merged?.dateTo),
    queryFn: () => fetchDashboard(merged!),
    placeholderData: keepPreviousData,
    staleTime: DASHBOARD_SYNC_MS,
    refetchInterval: DASHBOARD_SYNC_MS,
    retry: 2,
    retryDelay: 5000,
  })
}
