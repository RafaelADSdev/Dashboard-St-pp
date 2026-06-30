import type { RoletaStat } from '@/api/types'
import type { RoletaOperationalStatus } from '@/lib/roletaStatus'
import { ROLETA_STATUS_ORDER } from '@/lib/roletaStatus'
import {
  roletaMatchesCorretor,
  roletaMatchesDiretoria,
  roletaMatchesLiderancaTeam,
  type LiderancaTeamFilter,
} from '@/utils/roletaOrgFilter'

export type RoletaStatusFilter = RoletaOperationalStatus | 'todas'

export interface RoletasFilterState {
  diretoriaId: string
  liderancaId: string
  corretorId: string
  roletaId: string
  status: RoletaStatusFilter
}

export function filterRoletas(
  roletas: RoletaStat[],
  filters: RoletasFilterState,
  options?: { liderancaTeam?: LiderancaTeamFilter }
): RoletaStat[] {
  return roletas.filter((roleta) => {
    if (filters.roletaId && roleta.id !== filters.roletaId) {
      return false
    }

    if (filters.diretoriaId && !roletaMatchesDiretoria(roleta, filters.diretoriaId)) {
      return false
    }

    if (filters.liderancaId) {
      const team =
        options?.liderancaTeam ??
        ({
          id: filters.liderancaId,
          userIds: [],
        } satisfies LiderancaTeamFilter)

      if (!roletaMatchesLiderancaTeam(roleta, team)) {
        return false
      }
    }

    if (filters.corretorId && !roletaMatchesCorretor(roleta, filters.corretorId)) {
      return false
    }

    if (filters.status !== 'todas' && roleta.status !== filters.status) {
      return false
    }

    return true
  })
}

export function groupRoletasByStatus(
  roletas: RoletaStat[]
): Record<RoletaOperationalStatus, RoletaStat[]> {
  const groups: Record<RoletaOperationalStatus, RoletaStat[]> = {
    ativa: [],
    nova: [],
    suspensa: [],
  }

  for (const roleta of roletas) {
    groups[roleta.status].push(roleta)
  }

  for (const status of ROLETA_STATUS_ORDER) {
    groups[status].sort(
      (a, b) => b.totalLeads - a.totalLeads || a.title.localeCompare(b.title, 'pt-BR')
    )
  }

  return groups
}

export function countRoletasByStatus(roletas: RoletaStat[]) {
  return groupRoletasByStatus(roletas)
}
