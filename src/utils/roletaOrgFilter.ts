import type { RoletaCorretorMember, RoletaStat } from '@/api/types'

export interface LiderancaTeamFilter {
  id: string
  leaderId?: string
  userIds: string[]
}

export interface RoletasOrgFilterState {
  diretoriaId: string
  liderancaId: string
  corretorId: string
}

export function hasRoletasOrgFilter(filters: RoletasOrgFilterState): boolean {
  return Boolean(filters.diretoriaId || filters.liderancaId || filters.corretorId)
}

export function corretorMatchesRoletasOrgFilters(
  corretor: RoletaCorretorMember,
  filters: RoletasOrgFilterState,
  options?: { liderancaTeam?: LiderancaTeamFilter }
): boolean {
  if (!hasRoletasOrgFilter(filters)) return true

  if (filters.corretorId && corretor.corretorUserId !== filters.corretorId) {
    return false
  }

  if (filters.liderancaId) {
    const team =
      options?.liderancaTeam ??
      ({ id: filters.liderancaId, userIds: [] } satisfies LiderancaTeamFilter)

    if (!corretorMatchesLiderancaTeam(corretor, team)) {
      return false
    }
  }

  if (filters.diretoriaId && corretor.diretoriaId !== filters.diretoriaId) {
    return false
  }

  return true
}

export function corretorMatchesLiderancaTeam(
  corretor: RoletaCorretorMember,
  team: LiderancaTeamFilter
): boolean {
  if (corretor.equipeId === team.id) return true

  const leaderId = team.leaderId
  if (leaderId && corretor.liderancaId === leaderId) return true

  if (corretor.corretorUserId && team.userIds.includes(corretor.corretorUserId)) {
    return true
  }

  return false
}

export function roletaMatchesLiderancaTeam(
  roleta: RoletaStat,
  team: LiderancaTeamFilter
): boolean {
  if (roleta.equipeIds?.includes(team.id)) return true

  const leaderId = team.leaderId
  if (leaderId && roleta.liderancaIds?.includes(leaderId)) return true

  return (roleta.corretores ?? []).some((corretor) =>
    corretorMatchesLiderancaTeam(corretor, team)
  )
}

export function roletaMatchesDiretoria(roleta: RoletaStat, diretoriaId: string): boolean {
  if (roleta.diretoriaIds?.includes(diretoriaId)) return true

  return (roleta.corretores ?? []).some(
    (corretor) => corretor.diretoriaId === diretoriaId
  )
}

export function teamHasRoletaPresence(
  roleta: RoletaStat,
  team: LiderancaTeamFilter
): boolean {
  return roletaMatchesLiderancaTeam(roleta, team)
}

export function roletaMatchesCorretor(roleta: RoletaStat, corretorUserId: string): boolean {
  if (!corretorUserId) return true

  return (roleta.corretores ?? []).some(
    (corretor) => corretor.corretorUserId === corretorUserId
  )
}

export function corretorHasRoletaPresence(roleta: RoletaStat, corretorUserId: string): boolean {
  return roletaMatchesCorretor(roleta, corretorUserId)
}
