import type { RoletaMembershipSummary } from '@/api/types'
import type { StuppRoleta } from '@/api/bitrixRoletas'

export function countCorretoresAtivosRoleta(
  roletas: StuppRoleta[],
  membershipByRoletaId: Record<string, RoletaMembershipSummary>
): number {
  const activeRoletaIds = new Set(
    roletas.filter((roleta) => roleta.status === 'ativa').map((roleta) => roleta.id)
  )

  const corretorIds = new Set<string>()

  for (const [roletaId, membership] of Object.entries(membershipByRoletaId)) {
    if (!activeRoletaIds.has(roletaId)) continue

    for (const corretor of membership.corretores ?? []) {
      if (corretor.corretorUserId) {
        corretorIds.add(corretor.corretorUserId)
      }
    }
  }

  return corretorIds.size
}
