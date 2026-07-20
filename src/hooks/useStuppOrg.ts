import { useQuery } from '@tanstack/react-query'
import type { OrgPreview } from '@/lib/orgPreview'
import { STUPP_ORG_QUERY_KEY } from '@/lib/queryKeys'

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
    staleTime: 1000 * 60 * 60 * 24,
    retry: 0,
  })
}

export { getEquipeOptions, resolveAssignedByIds } from '@/lib/orgPreview'
