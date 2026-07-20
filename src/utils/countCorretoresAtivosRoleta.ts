import type { StuppOrgStructure } from '@/api/bitrixDepartments'
import type { StuppRoleta } from '@/api/bitrixRoletas'
import { resolveAssignedByIds } from '@/lib/orgPreview'
import { isKanbanActiveRoleta } from '@/lib/roletaStatus'
import type { FilterParams, RoletaMembershipSummary } from '@/api/types'
import { isCorretorAtivoNoHub } from '@/utils/filterRoletaCorretores'

export interface CountCorretoresAtivosOptions {
  stuppUserIds?: Set<string>
  filters?: Pick<FilterParams, 'diretoria' | 'equipe' | 'corretor' | 'roleta'>
  org?: StuppOrgStructure
}

export function countCorretoresAtivosRoleta(
  roletas: StuppRoleta[],
  membershipByRoletaId: Record<string, RoletaMembershipSummary>,
  options: CountCorretoresAtivosOptions = {}
): number {
  const { stuppUserIds, filters, org } = options
  const hasOrgFilter = Boolean(filters?.diretoria || filters?.equipe || filters?.corretor)
  const hasRoletaFilter = Boolean(filters?.roleta)

  const allowedUserIds =
    hasOrgFilter && org && filters
      ? new Set(
          resolveAssignedByIds(org, {
            diretoria: filters.diretoria ?? '',
            equipe: filters.equipe ?? '',
            corretor: filters.corretor,
          })
        )
      : stuppUserIds

  if (hasOrgFilter && (!allowedUserIds || allowedUserIds.size === 0)) {
    return 0
  }

  const activeRoletas = roletas.filter((roleta) =>
    isKanbanActiveRoleta({ status: roleta.status, stageId: roleta.stageId })
  )

  const roletasToCount = hasRoletaFilter
    ? activeRoletas.filter((roleta) => roleta.id === filters?.roleta)
    : activeRoletas

  const corretorIds = new Set<string>()

  for (const roleta of roletasToCount) {
    const membership = membershipByRoletaId[roleta.id]
    if (!membership) continue

    for (const corretor of membership.corretores ?? []) {
      if (!corretor.corretorUserId) continue
      if (!isCorretorAtivoNoHub(corretor, { activeStuppUserIds: stuppUserIds })) continue
      if (hasOrgFilter && allowedUserIds && !allowedUserIds.has(corretor.corretorUserId)) continue

      corretorIds.add(corretor.corretorUserId)
    }
  }

  return corretorIds.size
}
