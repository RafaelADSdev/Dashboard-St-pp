import { useQuery } from '@tanstack/react-query'
import type { RoletaMembershipSummary, StuppRoletaOption } from '@/api/types'
import { STUPP_ROLETAS_QUERY_KEY } from '@/lib/queryKeys'
import { DASHBOARD_SYNC_MS } from '@/lib/syncConfig'

export interface StuppRoletasCatalog {
  roletas: StuppRoletaOption[]
  membershipByRoletaId: Record<string, RoletaMembershipSummary>
  diretorias: { id: string; name: string; leaderName?: string }[]
  liderancas: { id: string; name: string; diretoriaId?: string }[]
}

async function fetchStuppRoletasCatalog(): Promise<StuppRoletasCatalog> {
  const res = await fetch('/api/roletas')

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Erro ao carregar roletas')
  }

  return res.json() as Promise<StuppRoletasCatalog>
}

export function useStuppRoletasCatalog() {
  return useQuery({
    queryKey: STUPP_ROLETAS_QUERY_KEY,
    queryFn: fetchStuppRoletasCatalog,
    staleTime: DASHBOARD_SYNC_MS,
    refetchInterval: DASHBOARD_SYNC_MS,
    retry: 0,
  })
}

/** @deprecated Prefira useStuppRoletasCatalog — mantido para filtros legados. */
export function useStuppRoletas() {
  const query = useStuppRoletasCatalog()
  return {
    ...query,
    data: query.data?.roletas,
  }
}
