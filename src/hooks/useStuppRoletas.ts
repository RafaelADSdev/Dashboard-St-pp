import { useQuery } from '@tanstack/react-query'
import type { RoletaMembershipSummary, StuppRoletaOption } from '@/api/types'

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
    queryKey: ['stupp-roletas', 'v8'],
    queryFn: fetchStuppRoletasCatalog,
    staleTime: 1000 * 60 * 60 * 24,
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
