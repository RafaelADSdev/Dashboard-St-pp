import type { StuppOrgStructure, StuppDiretoria } from '@/api/bitrixDepartments'
import { resolveRoletaLideranca } from '@/lib/resolveRoletaLideranca'
import { normalizeRoletaTitleKey } from '@/utils/filterRoletaLeads'
import type { RoletaMembershipSummary } from '@/api/types'

export function findDiretoria(
  org: StuppOrgStructure,
  diretoriaIdOrName: string
): StuppDiretoria | undefined {
  if (!diretoriaIdOrName) return undefined

  return org.diretorias.find(
    (diretoria) =>
      diretoria.id === diretoriaIdOrName || diretoria.name === diretoriaIdOrName
  )
}

export function getDiretoriaUserIds(diretoria: StuppDiretoria): string[] {
  const userIds = new Set(diretoria.teams.flatMap((team) => team.userIds))

  if (diretoria.leaderId) {
    userIds.add(diretoria.leaderId)
  }

  return [...userIds]
}

export function roletaBelongsToDiretoria(
  roleta: { id: string; title: string; assignedById?: string },
  membership: RoletaMembershipSummary | undefined,
  org: StuppOrgStructure,
  diretoria: StuppDiretoria
): boolean {
  if (membership?.diretoriaIds?.includes(diretoria.id)) {
    return true
  }

  const lideranca = resolveRoletaLideranca(roleta, org)
  if (diretoria.leaderId && lideranca.id === diretoria.leaderId) {
    return true
  }

  if (!diretoria.leaderId) return false

  return (membership?.corretores ?? []).some(
    (corretor) =>
      corretor.diretorUserId === diretoria.leaderId ||
      corretor.corretorUserId === diretoria.leaderId
  )
}

export function getRoletaTitleKeysForDiretoria(
  roletas: Array<{ id: string; title: string; assignedById?: string }>,
  membershipByRoletaId: Record<string, RoletaMembershipSummary>,
  org: StuppOrgStructure,
  diretoriaId: string
): Set<string> {
  const diretoria = findDiretoria(org, diretoriaId)
  if (!diretoria) return new Set()

  const keys = new Set<string>()

  for (const roleta of roletas) {
    const titleKey = normalizeRoletaTitleKey(roleta.title)
    if (!titleKey) continue

    const membership = membershipByRoletaId[roleta.id]
    if (roletaBelongsToDiretoria(roleta, membership, org, diretoria)) {
      keys.add(titleKey)
    }
  }

  return keys
}
