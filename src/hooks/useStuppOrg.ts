import { useQuery } from '@tanstack/react-query'
import type { OrgPreview } from '@/lib/orgPreview'
import { STUPP_ORG_QUERY_KEY } from '@/lib/queryKeys'
import { DASHBOARD_SYNC_MS } from '@/lib/syncConfig'

async function fetchOrgPreview(): Promise<OrgPreview> {
  const res = await fetch('/api/org')

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Erro ao carregar estrutura organizacional')
  }

  return res.json()
}

export function useStuppStructurePreview() {
  return useQuery({
    queryKey: STUPP_ORG_QUERY_KEY,
    queryFn: fetchOrgPreview,
    staleTime: DASHBOARD_SYNC_MS,
    refetchInterval: DASHBOARD_SYNC_MS,
    retry: 0,
  })
}

export { getEquipeOptions, resolveAssignedByIds } from '@/lib/orgPreview'
