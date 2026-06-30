import { getTeamLabel, type StuppOrgStructure } from '@/api/bitrixDepartments'
import type { StuppTeamOption } from '@/api/types'

export interface StuppCorretorOption {
  id: string
  name: string
  diretoria: string
  equipe: string
}

export function getCorretorOptions(org: StuppOrgStructure): StuppCorretorOption[] {
  return org.allUserIds
    .map((id) => ({
      id,
      name: org.userToName[id] ?? `Usuário #${id}`,
      diretoria: org.userToDiretoriaName[id] ?? 'Outros',
      equipe: org.userToTeamName[id] ?? 'Sem equipe',
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function getEquipeOptions(org: StuppOrgStructure): StuppTeamOption[] {
  return org.diretorias.flatMap((diretoria) =>
    diretoria.teams.map((team) => ({
      id: team.id,
      label: getTeamLabel(team),
      diretoria: diretoria.name,
      leaderName: team.leaderName,
    }))
  )
}

export function resolveAssignedByIds(
  org: StuppOrgStructure,
  filters: { diretoria: string; equipe: string; corretor?: string }
): string[] {
  if (filters.corretor) {
    return org.allUserIds.includes(filters.corretor) ? [filters.corretor] : []
  }

  if (filters.equipe) {
    const team = org.diretorias
      .flatMap((d) => d.teams)
      .find((t) => t.id === filters.equipe)
    return team?.userIds ?? []
  }

  if (filters.diretoria) {
    const diretoria = org.diretorias.find(
      (d) => d.id === filters.diretoria || d.name === filters.diretoria
    )
    if (!diretoria) return org.allUserIds
    return [...new Set(diretoria.teams.flatMap((t) => t.userIds))]
  }

  return org.allUserIds
}

export function buildOrgPreview(org: StuppOrgStructure) {
  return {
    org,
    equipes: getEquipeOptions(org),
    corretores: getCorretorOptions(org),
    diretorias: org.diretorias.map((d) => ({
      id: d.id,
      name: d.name,
      leaderName: d.leaderName,
      teams: d.teams.map((t) => ({
        id: t.id,
        name: t.name,
        label: getTeamLabel(t),
        leaderId: t.leaderId,
        leaderName: t.leaderName,
        userIds: t.userIds,
      })),
    })),
  }
}

export type OrgPreview = ReturnType<typeof buildOrgPreview>
