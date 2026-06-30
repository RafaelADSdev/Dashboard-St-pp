import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { FilterParams, LeadsDashboardData } from '@/api/types'
import { DASHBOARD_SYNC_MS } from '@/lib/syncConfig'

const CLIENT_FETCH_TIMEOUT_MS = 5 * 60_000

async function parseApiError(res: Response, fallback: string): Promise<string> {
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    if (res.status === 401 || res.redirected) {
      return 'Sessão expirada. Faça login novamente.'
    }
    return `${fallback} (HTTP ${res.status})`
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string }
  return body.error ?? fallback
}

async function fetchDashboard(filters: FilterParams): Promise<LeadsDashboardData> {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    esteira: filters.esteira,
    diretoria: filters.diretoria,
    equipe: filters.equipe,
    roleta: filters.roleta,
    corretor: filters.corretor,
  })

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), CLIENT_FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(`/api/dashboard?${params.toString()}`, {
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(await parseApiError(res, 'Erro ao carregar dados do dashboard'))
    }

    return res.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'A consulta ao Bitrix demorou demais. Tente um período menor ou configure webhooks separados.'
      )
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
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
    refetchInterval: (query) =>
      query.state.status === 'success' ? DASHBOARD_SYNC_MS : false,
    retry: 0,
  })
}
