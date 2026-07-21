import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { FilterParams, RoletasDashboardData } from '@/api/types'
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

async function fetchRoletasStats(filters: FilterParams): Promise<RoletasDashboardData> {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    diretoria: filters.diretoria,
    equipe: filters.equipe,
    corretor: filters.corretor,
  })

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), CLIENT_FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(`/api/roletas/stats?${params.toString()}`, {
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(await parseApiError(res, 'Erro ao carregar roletas'))
    }

    return res.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'A consulta aos dados demorou demais. Tente novamente ou use um período menor.'
      )
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export function useRoletasData(filters: FilterParams | null) {
  return useQuery({
    queryKey: ['roletas-stats', filters],
    enabled: Boolean(filters?.dateFrom && filters?.dateTo),
    queryFn: () => fetchRoletasStats(filters!),
    placeholderData: keepPreviousData,
    staleTime: DASHBOARD_SYNC_MS,
    refetchInterval: (query) =>
      query.state.status === 'success' ? DASHBOARD_SYNC_MS : false,
    retry: 0,
  })
}
