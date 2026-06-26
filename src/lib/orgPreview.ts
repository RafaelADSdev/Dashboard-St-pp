import { getTeamLabel, type StuppOrgStructure } from '@/api/bitrixDepartments'
import type { StuppTeamOption } from '@/api/types'

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
  filters: { diretoria: string; equipe: string }
): string[] {
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
    diretorias: org.diretorias.map((d) => ({
      id: d.id,
      name: d.name,
      leaderName: d.leaderName,
      teams: d.teams.map((t) => ({
        id: t.id,
        name: t.name,
        label: getTeamLabel(t),
        leaderName: t.leaderName,
      })),
    })),
  }
}

export type OrgPreview = ReturnType<typeof buildOrgPreview>
