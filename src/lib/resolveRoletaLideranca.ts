import type { StuppOrgStructure } from '@/api/bitrixDepartments'

export interface RoletaLideranca {
  id: string
  name: string
}

export const SEM_LIDERANCA_ID = '__sem_lideranca__'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function resolveRoletaLideranca(
  roleta: { title: string; assignedById?: string },
  org: StuppOrgStructure
): RoletaLideranca {
  const normalizedTitle = normalize(roleta.title)

  for (const diretoria of org.diretorias) {
    for (const team of diretoria.teams) {
      const teamTokens = [team.name, team.leaderName]
        .filter((value): value is string => Boolean(value))
        .map(normalize)

      for (const token of teamTokens) {
        if (token.length >= 3 && normalizedTitle.includes(token)) {
          return {
            id: team.leaderId ?? team.id,
            name: team.leaderName ?? team.name,
          }
        }
      }
    }

    if (diretoria.leaderName) {
      const leaderToken = normalize(diretoria.leaderName)
      if (leaderToken.length >= 3 && normalizedTitle.includes(leaderToken)) {
        return {
          id: diretoria.leaderId ?? diretoria.id,
          name: diretoria.leaderName,
        }
      }
    }
  }

  if (roleta.assignedById) {
    const teamId = org.userToTeamId[roleta.assignedById]
    const team = org.diretorias.flatMap((d) => d.teams).find((item) => item.id === teamId)

    if (team?.leaderName) {
      return {
        id: team.leaderId ?? team.id,
        name: team.leaderName,
      }
    }

    const userName = org.userToName[roleta.assignedById]
    if (userName) {
      return { id: roleta.assignedById, name: userName }
    }
  }

  return { id: SEM_LIDERANCA_ID, name: 'Sem liderança' }
}

export function collectLiderancaOptions(
  roletas: RoletaLideranca[]
): RoletaLideranca[] {
  const map = new Map<string, RoletaLideranca>()

  for (const item of roletas) {
    if (item.id === SEM_LIDERANCA_ID) continue
    map.set(item.id, item)
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
