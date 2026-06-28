import type { BitrixLead } from './types'
import { ROLETA_DEAL_FIELD } from './bitrixRoletas'
import { ESTEIRA_ECONOMICO_ID, ESTEIRA_GERAL_ID } from './bitrixConfig'
import { getTeamLabel, type StuppOrgStructure } from './bitrixDepartments'
import type { BitrixStageDefinition } from './bitrixStages'
import { normalizeStageId } from './bitrixStages'
import { addDays, differenceInDays, format, parseISO } from 'date-fns'

export type { BitrixLead }

const PAGE_SIZE = 50
/** O Bitrix só retorna até 500 registros por consulta de listagem */
const BITRIX_LIST_MAX = 500
const SAFETY_MAX_RECORDS = 15_000

export type DealQueryParams = {
  dateFrom: string
  dateTo: string
  categoryIds: string[]
  assignedByIds?: string[]
  roletaTitle?: string
}

interface BitrixDealRaw {
  ID?: string | number
  TITLE?: string
  ASSIGNED_BY_ID?: string | number
  STAGE_ID?: string
  CATEGORY_ID?: string | number
  DATE_CREATE?: string
  SOURCE_ID?: string
}

export function getBitrixWebhookUrl(): string {
  return '/api/bitrix/'
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

async function fetchUserNames(
  webhookUrl: string,
  userIds: string[]
): Promise<Record<string, string>> {
  if (userIds.length === 0) return {}

  const names: Record<string, string> = {}

  for (let i = 0; i < userIds.length; i += 50) {
    const chunk = userIds.slice(i, i + 50)
    const data = await bitrixPost<{ result: { ID: string; NAME: string; LAST_NAME: string }[] }>(
      webhookUrl,
      'user.get',
      { filter: { ID: chunk } }
    )

    for (const user of data.result ?? []) {
      const fullName = [user.NAME, user.LAST_NAME].filter(Boolean).join(' ').trim()
      names[user.ID] = fullName || `Usuário #${user.ID}`
    }
  }

  return names
}

export async function fetchStageDefinitions(
  webhookUrl: string,
  categoryId: string
): Promise<BitrixStageDefinition[]> {
  const data = await bitrixPost<{
    result: {
      STATUS_ID: string
      NAME: string
      SORT?: string
      SEMANTICS?: string | null
      EXTRA?: { SEMANTICS?: string }
    }[]
  }>(webhookUrl, 'crm.dealcategory.stage.list', { id: categoryId })

  return (data.result ?? [])
    .map((stage) => ({
      statusId: stage.STATUS_ID,
      name: stage.NAME,
      sort: Number(stage.SORT ?? 0),
      categoryId,
      semantics: stage.SEMANTICS ?? stage.EXTRA?.SEMANTICS ?? null,
    }))
    .sort((a, b) => a.sort - b.sort)
}

export async function fetchStageLabels(
  webhookUrl: string,
  categoryId: string
): Promise<Record<string, string>> {
  const res = await fetch(
    `${webhookUrl}crm.status.list.json?filter[ENTITY_ID]=DEAL_STAGE_${categoryId}`
  )
  const json = await res.json()

  if (json.error) {
    throw new Error(`Bitrix API error: ${json.error_description ?? json.error}`)
  }

  const labels: Record<string, string> = {}
  for (const stage of json.result ?? []) {
    labels[stage.STATUS_ID] = stage.NAME
  }
  return labels
}

export async function fetchSourceLabels(webhookUrl: string): Promise<Record<string, string>> {
  const data = await bitrixPost<{ result: { STATUS_ID: string; NAME: string }[] }>(
    webhookUrl,
    'crm.status.list',
    { filter: { ENTITY_ID: 'SOURCE' } }
  )

  const labels: Record<string, string> = {}
  for (const source of data.result ?? []) {
    labels[source.STATUS_ID] = source.NAME
  }
  return labels
}

export async function countDeals(
  webhookUrl: string,
  params: DealQueryParams
): Promise<number> {
  const filter: Record<string, unknown> = {
    '>=DATE_CREATE': params.dateFrom,
    '<=DATE_CREATE': params.dateTo,
    '@CATEGORY_ID': params.categoryIds,
  }

  if (params.assignedByIds?.length) {
    filter['@ASSIGNED_BY_ID'] = params.assignedByIds
  }

  if (params.roletaTitle) {
    filter[ROLETA_DEAL_FIELD] = params.roletaTitle
  }

  const data = await bitrixPost<{ total: number }>(webhookUrl, 'crm.deal.list', {
    filter,
    select: ['ID'],
    start: 0,
  })
  return data.total ?? 0
}

function normalizeDeal(
  raw: BitrixDealRaw,
  userNames: Record<string, string>,
  userToTeamName: Record<string, string>,
  userToDiretoriaName: Record<string, string>
): BitrixLead {
  const assignedId = String(raw.ASSIGNED_BY_ID ?? '')
  const categoryId = String(raw.CATEGORY_ID ?? '0')

  return {
    id: String(raw.ID ?? ''),
    title: String(raw.TITLE ?? ''),
    assigned_by_id: assignedId,
    assigned_by_name: userNames[assignedId] ?? (assignedId ? `Usuário #${assignedId}` : 'Sem responsável'),
    equipe: userToTeamName[assignedId] ?? 'Sem equipe',
    diretoria: userToDiretoriaName[assignedId] ?? 'Outros',
    stage_id: normalizeStageId(String(raw.STAGE_ID ?? ''), categoryId),
    category_id: categoryId,
    date_create: String(raw.DATE_CREATE ?? ''),
    source_id: String(raw.SOURCE_ID ?? ''),
  }
}

function dedupeDeals(deals: BitrixDealRaw[]): BitrixDealRaw[] {
  const seen = new Set<string>()
  return deals.filter((deal) => {
    const id = String(deal.ID ?? '')
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

async function fetchDealPages(
  webhookUrl: string,
  params: DealQueryParams
): Promise<BitrixDealRaw[]> {
  const allDeals: BitrixDealRaw[] = []
  let start = 0
  let expectedTotal: number | undefined

  while (start < BITRIX_LIST_MAX && allDeals.length < SAFETY_MAX_RECORDS) {
    const filter: Record<string, unknown> = {
      '>=DATE_CREATE': params.dateFrom,
      '<=DATE_CREATE': params.dateTo,
      '@CATEGORY_ID': params.categoryIds,
    }

    if (params.assignedByIds?.length) {
      filter['@ASSIGNED_BY_ID'] = params.assignedByIds
    }

    if (params.roletaTitle) {
      filter[ROLETA_DEAL_FIELD] = params.roletaTitle
    }

    const data = await bitrixPost<{ result: BitrixDealRaw[]; total?: number }>(
      webhookUrl,
      'crm.deal.list',
      {
        filter,
        select: [
          'ID',
          'TITLE',
          'ASSIGNED_BY_ID',
          'STAGE_ID',
          'CATEGORY_ID',
          'DATE_CREATE',
          'SOURCE_ID',
        ],
        order: { DATE_CREATE: 'DESC' },
        start,
      }
    )

    if (expectedTotal === undefined && data.total !== undefined) {
      expectedTotal = data.total
    }

    const batch = data.result ?? []
    allDeals.push(...batch)

    if (batch.length < PAGE_SIZE) break
    if (expectedTotal !== undefined && allDeals.length >= expectedTotal) break

    start += PAGE_SIZE
    await sleep(150)
  }

  return allDeals
}

async function fetchDealsWithSplit(
  webhookUrl: string,
  params: DealQueryParams
): Promise<BitrixDealRaw[]> {
  const total = await countDeals(webhookUrl, params)
  if (total === 0) return []
  if (total <= BITRIX_LIST_MAX) {
    return fetchDealPages(webhookUrl, params)
  }

  const from = parseISO(params.dateFrom)
  const to = parseISO(params.dateTo)
  if (differenceInDays(to, from) < 1) {
    return fetchDealPages(webhookUrl, params)
  }

  const mid = addDays(from, Math.floor(differenceInDays(to, from) / 2))
  const midStr = format(mid, 'yyyy-MM-dd')
  const rightStart = format(addDays(mid, 1), 'yyyy-MM-dd')

  const [left, right] = await Promise.all([
    fetchDealsWithSplit(webhookUrl, { ...params, dateTo: midStr }),
    fetchDealsWithSplit(webhookUrl, { ...params, dateFrom: rightStart }),
  ])

  return dedupeDeals([...left, ...right])
}

export async function fetchBreakdownCounts(
  webhookUrl: string,
  params: DealQueryParams & { scopeUserIds: string[] },
  org: StuppOrgStructure
) {
  const scope = new Set(params.scopeUserIds)

  const countUsers = async (userIds: string[]) => {
    const ids = [...new Set(userIds.filter((id) => scope.has(id)))]
    if (ids.length === 0) return 0

    return countDeals(webhookUrl, {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      categoryIds: params.categoryIds,
      assignedByIds: ids,
      roletaTitle: params.roletaTitle,
    })
  }

  const byDiretoria = await Promise.all(
    org.diretorias.map(async (diretoria) => ({
      id: diretoria.id,
      name: diretoria.name,
      leads: await countUsers(diretoria.teams.flatMap((team) => team.userIds)),
    }))
  )

  const byTeam = await Promise.all(
    org.diretorias.flatMap((diretoria) =>
      diretoria.teams.map(async (team) => ({
        equipe: getTeamLabel(team),
        leads: await countUsers(team.userIds),
      }))
    )
  )

  return { byDiretoria, byTeam }
}

export async function fetchLeadsFromBitrix(
  webhookUrl: string,
  params: DealQueryParams & {
    userToTeamName?: Record<string, string>
    userToDiretoriaName?: Record<string, string>
  }
): Promise<BitrixLead[]> {
  const userToTeamName = params.userToTeamName ?? {}
  const userToDiretoriaName = params.userToDiretoriaName ?? {}

  const rawByCategory = await Promise.all(
    params.categoryIds.map((categoryId) =>
      fetchDealsWithSplit(webhookUrl, { ...params, categoryIds: [categoryId] })
    )
  )

  const allDeals = dedupeDeals(rawByCategory.flat())
  const userIds = new Set<string>()

  for (const deal of allDeals) {
    if (deal.ASSIGNED_BY_ID) {
      userIds.add(String(deal.ASSIGNED_BY_ID))
    }
  }

  const userNames = await fetchUserNames(webhookUrl, [...userIds])
  return allDeals.map((deal) =>
    normalizeDeal(deal, userNames, userToTeamName, userToDiretoriaName)
  )
}

export async function fetchEsteiraCounts(
  webhookUrl: string,
  dateFrom: string,
  dateTo: string,
  assignedByIds?: string[],
  roletaTitle?: string
) {
  const baseParams = { dateFrom, dateTo, assignedByIds, roletaTitle }
  const [geral, economico] = await Promise.all([
    countDeals(webhookUrl, { ...baseParams, categoryIds: [ESTEIRA_GERAL_ID] }),
    countDeals(webhookUrl, { ...baseParams, categoryIds: [ESTEIRA_ECONOMICO_ID] }),
  ])
  return { geral, economico, total: geral + economico }
}
