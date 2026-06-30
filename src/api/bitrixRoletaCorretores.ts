import type { StuppOrgStructure } from '@/api/bitrixDepartments'
import type { BitrixWebhookRef } from '@/api/bitrix'
import { bitrixPost } from '@/api/bitrixRequest'
import { isStuppRoletaTitle } from '@/api/bitrixRoletas'

/** SPA Bitrix — aba "Corretores da roleta" (entity type 186). */
export const ROLETA_CORRETOR_ENTITY_TYPE_ID = 186
export const ROLETA_CORRETOR_NAME_FIELD = 'ufCrm11_1714667843286'
export const ROLETA_CORRETOR_CARGO_FIELD = 'ufCrm11_1714673477606'
export const ROLETA_CORRETOR_DIRETOR_FIELD = 'ufCrm11_1738080141'
export const ROLETA_CORRETOR_USER_FIELD = 'ufCrm11_1738081725'
export const ROLETA_CORRETOR_ROLETA_NAME_FIELD = 'ufCrm11_1738081783'

export const ROLETA_CARGO_LABELS: Record<string, string> = {
  '1597': 'Superintendente',
  '1599': 'Diretor',
  '1601': 'Líder',
  '1603': 'Líder Trainee',
  '1605': 'Mentor',
  '1607': 'Corretor Definitivo',
  '1609': 'Corretor Estagiário',
  '1611': 'Sem CRECI',
}

export interface BitrixRoletaCorretorItem {
  id: number | string
  title?: string
  [ROLETA_CORRETOR_NAME_FIELD]?: string
  [ROLETA_CORRETOR_CARGO_FIELD]?: string | number | null
  [ROLETA_CORRETOR_DIRETOR_FIELD]?: string | number | null
  [ROLETA_CORRETOR_USER_FIELD]?: string | number | null
  [ROLETA_CORRETOR_ROLETA_NAME_FIELD]?: string
}

export interface RoletaCorretorMember {
  recordId: string
  nome: string
  corretorUserId?: string
  diretorUserId?: string
  cargoId?: string
  cargoLabel?: string
  diretoriaId?: string
  diretoriaName?: string
  equipeId?: string
  liderancaId?: string
  liderancaName?: string
  equipe?: string
}

export interface RoletaMembership {
  roletaTitle: string
  corretores: RoletaCorretorMember[]
  diretoriaIds: string[]
  liderancaIds: string[]
  equipeIds: string[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function buildUserDiretoriaIdMap(org: StuppOrgStructure): Record<string, string> {
  const map: Record<string, string> = {}
  for (const diretoria of org.diretorias) {
    for (const team of diretoria.teams) {
      for (const userId of team.userIds) {
        map[userId] = diretoria.id
      }
    }
  }
  return map
}

function buildUserLiderancaMap(org: StuppOrgStructure): Record<
  string,
  { id: string; name: string }
> {
  const map: Record<string, { id: string; name: string }> = {}
  for (const diretoria of org.diretorias) {
    for (const team of diretoria.teams) {
      const leaderId = team.leaderId ?? team.id
      const leaderName = team.leaderName ?? team.name
      for (const userId of team.userIds) {
        map[userId] = { id: leaderId, name: leaderName }
      }
    }
  }
  return map
}

function resolveDiretoriaByLeaderId(org: StuppOrgStructure, leaderId: string) {
  return org.diretorias.find((diretoria) => diretoria.leaderId === leaderId)
}

export function formatLiderancaFilterLabel(team: {
  name: string
  leaderName?: string
}): string {
  const leader = team.leaderName?.trim() || 'Sem líder'
  return `${leader} - ${team.name}`
}

function findTeam(org: StuppOrgStructure, teamId: string) {
  for (const diretoria of org.diretorias) {
    const team = diretoria.teams.find((item) => item.id === teamId)
    if (team) return team
  }
  return undefined
}

function enrichCorretorMember(
  item: BitrixRoletaCorretorItem,
  org: StuppOrgStructure,
  userDiretoriaId: Record<string, string>,
  userLideranca: Record<string, { id: string; name: string }>
): RoletaCorretorMember | null {
  const roletaTitle = normalizeTitle(item[ROLETA_CORRETOR_ROLETA_NAME_FIELD] ?? '')
  if (!roletaTitle || !isStuppRoletaTitle(roletaTitle)) return null

  const corretorUserId = item[ROLETA_CORRETOR_USER_FIELD]
    ? String(item[ROLETA_CORRETOR_USER_FIELD])
    : undefined
  const diretorUserId = item[ROLETA_CORRETOR_DIRETOR_FIELD]
    ? String(item[ROLETA_CORRETOR_DIRETOR_FIELD])
    : undefined
  const cargoId = item[ROLETA_CORRETOR_CARGO_FIELD]
    ? String(item[ROLETA_CORRETOR_CARGO_FIELD])
    : undefined

  const nome =
    normalizeTitle(item[ROLETA_CORRETOR_NAME_FIELD] ?? '') ||
    normalizeTitle(item.title ?? '') ||
    'Sem nome'

  let diretoriaId = corretorUserId ? userDiretoriaId[corretorUserId] : undefined
  let diretoriaName: string | undefined
  const equipeId = corretorUserId ? org.userToTeamId[corretorUserId] : undefined
  const team = equipeId ? findTeam(org, equipeId) : undefined
  let liderancaId = corretorUserId ? userLideranca[corretorUserId]?.id : undefined
  let liderancaName = team ? formatLiderancaFilterLabel(team) : undefined
  let equipe = corretorUserId ? org.userToTeamName[corretorUserId] : undefined

  if (diretoriaId) {
    diretoriaName = org.diretorias.find((d) => d.id === diretoriaId)?.name
  }

  if (diretorUserId) {
    const diretoria = resolveDiretoriaByLeaderId(org, diretorUserId)
    if (diretoria) {
      diretoriaId = diretoria.id
      diretoriaName = diretoria.name
    }
  }

  return {
    recordId: String(item.id),
    nome,
    corretorUserId,
    diretorUserId,
    cargoId,
    cargoLabel: cargoId ? ROLETA_CARGO_LABELS[cargoId] : undefined,
    diretoriaId,
    diretoriaName,
    equipeId,
    liderancaId,
    liderancaName,
    equipe,
  }
}

export async function fetchRoletaCorretorItems(
  webhookUrl: BitrixWebhookRef
): Promise<BitrixRoletaCorretorItem[]> {
  const all: BitrixRoletaCorretorItem[] = []
  let start = 0

  while (true) {
    const data = await bitrixPost<{
      result?: { items?: BitrixRoletaCorretorItem[] }
      next?: number
    }>(webhookUrl, 'crm.item.list', {
      entityTypeId: ROLETA_CORRETOR_ENTITY_TYPE_ID,
      filter: { [`%${ROLETA_CORRETOR_ROLETA_NAME_FIELD}`]: 'Stüpp' },
      select: [
        'id',
        'title',
        ROLETA_CORRETOR_NAME_FIELD,
        ROLETA_CORRETOR_CARGO_FIELD,
        ROLETA_CORRETOR_DIRETOR_FIELD,
        ROLETA_CORRETOR_USER_FIELD,
        ROLETA_CORRETOR_ROLETA_NAME_FIELD,
      ],
      order: { id: 'ASC' },
      start,
    })

    all.push(...(data.result?.items ?? []))

    if (data.next === undefined) break
    start = data.next
    await sleep(100)
  }

  return all
}

export function buildRoletaMembershipIndex(
  items: BitrixRoletaCorretorItem[],
  org: StuppOrgStructure
): {
  byTitle: Map<string, RoletaMembership>
  byRoletaId: Record<string, RoletaMembership>
  roletaTitles: string[]
} {
  const userDiretoriaId = buildUserDiretoriaIdMap(org)
  const userLideranca = buildUserLiderancaMap(org)
  const byTitle = new Map<string, RoletaMembership>()

  for (const item of items) {
    const roletaTitle = normalizeTitle(item[ROLETA_CORRETOR_ROLETA_NAME_FIELD] ?? '')
    if (!roletaTitle || !isStuppRoletaTitle(roletaTitle)) continue

    const member = enrichCorretorMember(item, org, userDiretoriaId, userLideranca)
    if (!member) continue

    const existing =
      byTitle.get(roletaTitle) ??
      ({
        roletaTitle,
        corretores: [],
        diretoriaIds: [],
        liderancaIds: [],
        equipeIds: [],
      } satisfies RoletaMembership)

    const duplicate = existing.corretores.some(
      (entry) =>
        entry.recordId === member.recordId ||
        (member.corretorUserId &&
          entry.corretorUserId === member.corretorUserId &&
          entry.nome === member.nome)
    )
    if (!duplicate) {
      existing.corretores.push(member)
    }

    byTitle.set(roletaTitle, existing)
  }

  for (const membership of byTitle.values()) {
    membership.corretores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

    const diretoriaIds = new Set<string>()
    const liderancaIds = new Set<string>()
    const equipeIds = new Set<string>()

    for (const corretor of membership.corretores) {
      if (corretor.diretoriaId) diretoriaIds.add(corretor.diretoriaId)
      if (corretor.liderancaId) liderancaIds.add(corretor.liderancaId)
      if (corretor.equipeId) equipeIds.add(corretor.equipeId)
    }

    membership.diretoriaIds = [...diretoriaIds]
    membership.liderancaIds = [...liderancaIds]
    membership.equipeIds = [...equipeIds]
  }

  return {
    byTitle,
    byRoletaId: {},
    roletaTitles: [...byTitle.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  }
}

export function attachMembershipToRoletaIds(
  index: ReturnType<typeof buildRoletaMembershipIndex>,
  roletas: { id: string; title: string }[]
): Record<string, RoletaMembership> {
  const byRoletaId: Record<string, RoletaMembership> = {}

  for (const roleta of roletas) {
    const title = normalizeTitle(roleta.title)
    const membership = index.byTitle.get(title)
    if (membership) {
      byRoletaId[roleta.id] = membership
    }
  }

  index.byRoletaId = byRoletaId
  return byRoletaId
}

export function collectMembershipLiderancaOptions(
  membershipByRoletaId: Record<string, RoletaMembership>,
  org: StuppOrgStructure,
  diretoriaId?: string
) {
  const teamIds = new Set<string>()
  for (const membership of Object.values(membershipByRoletaId)) {
    for (const id of membership.equipeIds) {
      teamIds.add(id)
    }
  }

  const options: { id: string; name: string; diretoriaId?: string }[] = []

  for (const diretoria of org.diretorias) {
    if (diretoriaId && diretoria.id !== diretoriaId) continue

    for (const team of diretoria.teams) {
      if (!teamIds.has(team.id)) continue

      options.push({
        id: team.id,
        name: formatLiderancaFilterLabel(team),
        diretoriaId: diretoria.id,
      })
    }
  }

  return options.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
