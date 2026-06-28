import { useQuery } from '@tanstack/react-query'
import type { StuppRoletaOption } from '@/api/types'

interface RoletasResponse {
  roletas: StuppRoletaOption[]
}

async function fetchStuppRoletas(): Promise<StuppRoletaOption[]> {
  const res = await fetch('/api/roletas')

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Erro ao carregar roletas')
  }

  const data = (await res.json()) as RoletasResponse
  return data.roletas
}

export function useStuppRoletas() {
  return useQuery({
    queryKey: ['stupp-roletas'],
    queryFn: fetchStuppRoletas,
    staleTime: 1000 * 60 * 60 * 24,
  })
}
