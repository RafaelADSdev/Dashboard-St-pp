import type { RoletaStat } from '@/api/types'
import type { RoletaOperationalStatus } from '@/lib/roletaStatus'
import { ROLETA_STATUS_ORDER } from '@/lib/roletaStatus'
import {
  corretorMatchesRoletasOrgFilters,
  hasRoletasOrgFilter,
  roletaMatchesCorretor,
  roletaMatchesDiretoria,
  roletaMatchesLiderancaTeam,
  type LiderancaTeamFilter,
  type RoletasOrgFilterState,
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

function sumCorretorLeadTotals(corretores: RoletaStat['corretores']) {
  let totalLeads = 0
  let geralLeads = 0
  let economicoLeads = 0

  for (const corretor of corretores ?? []) {
    totalLeads += corretor.totalLeads ?? 0
    geralLeads += corretor.geralLeads ?? 0
    economicoLeads += corretor.economicoLeads ?? 0
  }

  return { totalLeads, geralLeads, economicoLeads }
}

export function scopeRoletasCorretores(
  roletas: RoletaStat[],
  filters: RoletasOrgFilterState,
  options?: { liderancaTeam?: LiderancaTeamFilter }
): RoletaStat[] {
  if (!hasRoletasOrgFilter(filters)) return roletas

  return roletas.map((roleta) => {
    const corretores = (roleta.corretores ?? []).filter((corretor) =>
      corretorMatchesRoletasOrgFilters(corretor, filters, options)
    )
    const leadTotals = sumCorretorLeadTotals(corretores)

    return {
      ...roleta,
      corretores,
      ...leadTotals,
    }
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
