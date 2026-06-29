import { getBitrixWebhookUrl } from './bitrix'

export const STUPP_SUPERINTENDENCY_ID = '3'
export const COMERCIAL_S_ID = '60'

export interface BitrixDepartment {
  ID: string
  NAME: string
  PARENT: string
  UF_HEAD?: string
}

export interface BitrixUser {
  ID: string
  NAME: string
  LAST_NAME: string
  UF_DEPARTMENT?: (string | number)[]
}

export interface StuppTeam {
  id: string
  name: string
  diretoriaId: string
  diretoriaName: string
  leaderId?: string
  leaderName?: string
  userIds: string[]
}

export interface StuppDiretoria {
  id: string
  name: string
  leaderId?: string
  leaderName?: string
  teams: StuppTeam[]
}

export interface StuppOrgStructure {
  diretorias: StuppDiretoria[]
  allUserIds: string[]
  userToTeamId: Record<string, string>
  userToTeamName: Record<string, string>
  userToDiretoriaName: Record<string, string>
  userToName: Record<string, string>
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function bitrixPost<T>(
  webhookUrl: string,
  method: string,
  body: Record<string, unknown>,
  retries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${webhookUrl}${method}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (data.error || res.status === 429) {
      const msg = String(data.error_description ?? data.error ?? res.statusText)
      if ((msg.includes('operation time limit') || res.status === 429) && attempt < retries) {
        await sleep((attempt + 1) * 4000)
        continue
      }
      throw new Error(`Bitrix API error: ${msg}`)
    }

    return data
  }

  throw new Error('Bitrix API error: limite de requisições excedido')
}

async function fetchAllPages<T>(
  webhookUrl: string,
  method: string,
  body: Record<string, unknown> = {}
): Promise<T[]> {
  const all: T[] = []
  let start = 0

  while (true) {
    const data = await bitrixPost<{ result: T[]; next?: number }>(webhookUrl, method, {
      ...body,
      start,
    })

    all.push(...(data.result ?? []))

    if (data.next === undefined) break
    start = data.next
    await sleep(100)
  }

  return all
}

export function getDescendantIds(
  departments: BitrixDepartment[],
  rootId: string
): Set<string> {
  const ids = new Set([String(rootId)])
  let changed = true

  while (changed) {
    changed = false
    for (const dept of departments) {
      if (ids.has(String(dept.PARENT)) && !ids.has(String(dept.ID))) {
        ids.add(String(dept.ID))
        changed = true
      }
    }
  }

  return ids
}

function getChildren(
  departments: BitrixDepartment[],
  parentId: string
): BitrixDepartment[] {
  return departments
    .filter((d) => String(d.PARENT) === String(parentId))
    .sort((a, b) => a.NAME.localeCompare(b.NAME, 'pt-BR'))
}

function getDepth(
  deptId: string,
  departments: BitrixDepartment[],
  cache: Map<string, number> = new Map()
): number {
  if (cache.has(deptId)) return cache.get(deptId)!

  const dept = departments.find((d) => String(d.ID) === deptId)
  if (!dept || String(dept.PARENT) === '0' || !dept.PARENT) {
    cache.set(deptId, 0)
    return 0
  }

  const depth = 1 + getDepth(String(dept.PARENT), departments, cache)
  cache.set(deptId, depth)
  return depth
}

function collectSubtreeUserIds(
  rootDeptId: string,
  departments: BitrixDepartment[],
  stuppDeptIds: Set<string>,
  users: BitrixUser[]
): string[] {
  const subtreeIds = getDescendantIds(
    departments.filter((d) => stuppDeptIds.has(String(d.ID))),
    rootDeptId
  )
  subtreeIds.add(String(rootDeptId))

  return [
    ...new Set(
      users
        .filter((u) =>
          (u.UF_DEPARTMENT ?? []).some((deptId) => subtreeIds.has(String(deptId)))
        )
        .map((u) => String(u.ID))
    ),
  ]
}

function buildUserMaps(
  users: BitrixUser[],
  departments: BitrixDepartment[],
  stuppDeptIds: Set<string>,
  diretoriaIds: Set<string>,
  teamById: Map<string, StuppTeam>,
  userNames: Record<string, string>
) {
  const userToTeamId: Record<string, string> = {}
  const userToTeamName: Record<string, string> = {}
  const userToDiretoriaName: Record<string, string> = {}

  for (const user of users) {
    const userDeptIds = (user.UF_DEPARTMENT ?? [])
      .map(String)
      .filter((id) => stuppDeptIds.has(id))

    if (userDeptIds.length === 0) continue

    const sorted = [...userDeptIds].sort(
      (a, b) => getDepth(b, departments) - getDepth(a, departments)
    )

    const primaryDeptId = sorted[0]
    const primaryDept = departments.find((d) => String(d.ID) === primaryDeptId)

    let teamId = primaryDeptId
    let teamName = primaryDept?.NAME ?? 'Sem equipe'
    let diretoriaName = 'Outros'

    if (teamById.has(primaryDeptId)) {
      const team = teamById.get(primaryDeptId)!
      teamId = team.id
      teamName = team.name
      diretoriaName = team.diretoriaName
    } else {
      for (const deptId of sorted) {
        if (teamById.has(deptId)) {
          const team = teamById.get(deptId)!
          teamId = team.id
          teamName = team.name
          diretoriaName = team.diretoriaName
          break
        }
      }

      if (diretoriaName === 'Outros') {
        for (const deptId of sorted) {
          const dept = departments.find((d) => String(d.ID) === deptId)
          if (!dept) continue

          let ancestorId = deptId
          while (ancestorId) {
            if (diretoriaIds.has(ancestorId)) {
              diretoriaName =
                departments.find((d) => String(d.ID) === ancestorId)?.NAME ?? diretoriaName
              break
            }
            const parent = departments.find((d) => String(d.ID) === ancestorId)
            ancestorId = parent?.PARENT ? String(parent.PARENT) : ''
          }
        }
      }
    }

    userToTeamId[String(user.ID)] = teamId
    userToTeamName[String(user.ID)] = teamName
    userToDiretoriaName[String(user.ID)] = diretoriaName

    void userNames
  }

  return { userToTeamId, userToTeamName, userToDiretoriaName }
}

async function fetchUserNames(
  webhookUrl: string,
  userIds: string[]
): Promise<Record<string, string>> {
  if (userIds.length === 0) return {}

  const names: Record<string, string> = {}

  for (let i = 0; i < userIds.length; i += 50) {
    const chunk = userIds.slice(i, i + 50)
    const data = await bitrixPost<{ result: BitrixUser[] }>(webhookUrl, 'user.get', {
      filter: { ID: chunk },
    })

    for (const user of data.result ?? []) {
      const fullName = [user.NAME, user.LAST_NAME].filter(Boolean).join(' ').trim()
      names[user.ID] = fullName || `Usuário #${user.ID}`
    }
  }

  return names
}

function isListableTeam(dept: BitrixDepartment, diretoriaIds: Set<string>): boolean {
  if (diretoriaIds.has(String(dept.ID))) return false
  if (dept.NAME === 'SDR-S' || dept.NAME === 'RS - S') return false
  return true
}

export function buildStuppOrgStructure(
  departments: BitrixDepartment[],
  users: BitrixUser[],
  userNames: Record<string, string>
): StuppOrgStructure {
  const stuppDeptIds = getDescendantIds(departments, STUPP_SUPERINTENDENCY_ID)

  const diretoriaDepts = getChildren(departments, COMERCIAL_S_ID)
  const diretoriaIds = new Set(diretoriaDepts.map((d) => String(d.ID)))

  const teamById = new Map<string, StuppTeam>()
  const diretorias: StuppDiretoria[] = []

  for (const diretoria of diretoriaDepts) {
    const diretoriaId = String(diretoria.ID)
    const teamDepts = getChildren(departments, diretoriaId).filter((d) =>
      isListableTeam(d, diretoriaIds)
    )

    const teams: StuppTeam[] = []

    for (const teamDept of teamDepts) {
      const teamId = String(teamDept.ID)
      const leaderId = teamDept.UF_HEAD ? String(teamDept.UF_HEAD) : undefined
      const userIds = collectSubtreeUserIds(teamId, departments, stuppDeptIds, users)

      const team: StuppTeam = {
        id: teamId,
        name: teamDept.NAME,
        diretoriaId,
        diretoriaName: diretoria.NAME,
        leaderId,
        leaderName: leaderId ? userNames[leaderId] : undefined,
        userIds,
      }

      teams.push(team)
      teamById.set(teamId, team)

      for (const ltDept of getChildren(departments, teamId)) {
        if (!isListableTeam(ltDept, diretoriaIds)) continue

        const ltId = String(ltDept.ID)
        const ltLeaderId = ltDept.UF_HEAD ? String(ltDept.UF_HEAD) : undefined
        const ltUserIds = collectSubtreeUserIds(ltId, departments, stuppDeptIds, users)

        const ltTeam: StuppTeam = {
          id: ltId,
          name: ltDept.NAME,
          diretoriaId,
          diretoriaName: diretoria.NAME,
          leaderId: ltLeaderId,
          leaderName: ltLeaderId ? userNames[ltLeaderId] : ltDept.NAME.replace(' - LT', ''),
          userIds: ltUserIds,
        }

        teams.push(ltTeam)
        teamById.set(ltId, ltTeam)
      }
    }

    const diretoriaLeaderId = diretoria.UF_HEAD ? String(diretoria.UF_HEAD) : undefined

    diretorias.push({
      id: diretoriaId,
      name: diretoria.NAME,
      leaderId: diretoriaLeaderId,
      leaderName: diretoriaLeaderId ? userNames[diretoriaLeaderId] : undefined,
      teams: teams.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    })
  }

  const stuppUsers = users.filter((u) =>
    (u.UF_DEPARTMENT ?? []).some((d) => stuppDeptIds.has(String(d)))
  )

  const { userToTeamId, userToTeamName, userToDiretoriaName } = buildUserMaps(
    stuppUsers,
    departments,
    stuppDeptIds,
    diretoriaIds,
    teamById,
    userNames
  )

  const allUserIds = stuppUsers.map((u) => String(u.ID))
  const userToName: Record<string, string> = {}
  for (const userId of allUserIds) {
    userToName[userId] = userNames[userId] ?? `Usuário #${userId}`
  }

  return {
    diretorias: diretorias.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    allUserIds,
    userToTeamId,
    userToTeamName,
    userToDiretoriaName,
    userToName,
  }
}

export async function fetchStuppOrgStructure(
  webhookUrl = getBitrixWebhookUrl()
): Promise<StuppOrgStructure> {
  const [departments, users] = await Promise.all([
    fetchAllPages<BitrixDepartment>(webhookUrl, 'department.get'),
    fetchAllPages<BitrixUser>(webhookUrl, 'user.get', {
      filter: { ACTIVE: true },
      select: ['ID', 'NAME', 'LAST_NAME', 'UF_DEPARTMENT'],
    }),
  ])

  const stuppDeptIds = getDescendantIds(departments, STUPP_SUPERINTENDENCY_ID)
  const headIds = departments
    .filter((d) => stuppDeptIds.has(String(d.ID)) && d.UF_HEAD)
    .map((d) => String(d.UF_HEAD))

  const stuppUsers = users.filter((u) =>
    (u.UF_DEPARTMENT ?? []).some((d) => stuppDeptIds.has(String(d)))
  )

  const userNames = await fetchUserNames(webhookUrl, [
    ...new Set([...headIds, ...stuppUsers.map((u) => String(u.ID))]),
  ])

  return buildStuppOrgStructure(departments, users, userNames)
}

export function getTeamUserIds(org: StuppOrgStructure, teamId: string): string[] {
  for (const diretoria of org.diretorias) {
    const team = diretoria.teams.find((t) => t.id === teamId)
    if (team) return team.userIds
  }
  return []
}

export function getTeamLabel(team: StuppTeam): string {
  if (team.leaderName && !team.name.includes(' - LT')) {
    return `${team.name} — ${team.leaderName}`
  }
  return team.leaderName ?? team.name
}
