import type { RoletaCorretorMember, RoletaStat } from '@/api/types'

export interface LiderancaTeamFilter {
  id: string
  leaderId?: string
  userIds: string[]
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
