import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RoletaOperationalStatus } from '@/lib/roletaStatus'

async function parseError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string }
  return body.error ?? 'Erro na operação'
}

export function useRoletaMutations() {
  const queryClient = useQueryClient()

  async function refreshCatalog() {
    await queryClient.invalidateQueries({ queryKey: ['stupp-roletas'] })
  }

  const updateStatus = useMutation({
    mutationFn: async ({
      roletaId,
      status,
    }: {
      roletaId: string
      status: RoletaOperationalStatus
    }) => {
      const res = await fetch(`/api/roletas/${roletaId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(await parseError(res))
      return res.json()
    },
    onSuccess: refreshCatalog,
  })

  const addCorretor = useMutation({
    mutationFn: async ({
      roletaId,
      roletaTitle,
      corretorUserId,
      corretorName,
    }: {
      roletaId: string
      roletaTitle: string
      corretorUserId: string
      corretorName: string
    }) => {
      const res = await fetch(`/api/roletas/${roletaId}/corretores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roletaTitle, corretorUserId, corretorName }),
      })
      if (!res.ok) throw new Error(await parseError(res))
      return res.json()
    },
    onSuccess: refreshCatalog,
  })

  const removeCorretor = useMutation({
    mutationFn: async ({
      roletaId,
      recordId,
    }: {
      roletaId: string
      recordId: string
    }) => {
      const res = await fetch(`/api/roletas/${roletaId}/corretores`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId }),
      })
      if (!res.ok) throw new Error(await parseError(res))
      return res.json()
    },
    onSuccess: refreshCatalog,
  })

  return { updateStatus, addCorretor, removeCorretor }
}
