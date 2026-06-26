import { useQuery } from '@tanstack/react-query'
import { fetchStuppOrgStructure, getTeamLabel } from '@/api/bitrixDepartments'
import { getBitrixWebhookUrl } from '@/api/bitrix'
import type { StuppTeamOption } from '@/api/types'

export function useStuppStructurePreview() {
  return useQuery({
    queryKey: ['stupp-org'],
    queryFn: async () => {
      const org = await fetchStuppOrgStructure(getBitrixWebhookUrl())
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
    },
    staleTime: 1000 * 60 * 60 * 24,
  })
}

export function getEquipeOptions(org: Awaited<ReturnType<typeof fetchStuppOrgStructure>>): StuppTeamOption[] {
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
  org: Awaited<ReturnType<typeof fetchStuppOrgStructure>>,
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
