import { bitrixPost } from '@/api/bitrixRequest'
import type { BitrixLead } from './types'
import { ROLETA_DEAL_FIELD } from './bitrixRoletas'
import { ESTEIRA_ECONOMICO_ID, ESTEIRA_GERAL_ID } from './bitrixConfig'
import {
  GERAL_ENTRADA_DATE_FIELD,
  GERAL_NOVOS_LEADS_DATE_FIELD,
  BITRIX_DEAL_LIST_SELECT,
  buildDealDateFilterVariants,
  isDealEntryInRange,
  resolveDealArrivedAt,
  resolveDealLastMovementAt,
} from '@/lib/bitrixDealDates'
import { getTeamLabel, type StuppOrgStructure } from './bitrixDepartments'
import type { BitrixStageDefinition } from './bitrixStages'
import { normalizeStageId, normalizeStageColor } from './bitrixStages'

export type { BitrixLead }

const PAGE_SIZE = 50
const SAFETY_MAX_RECORDS = 15_000

const DEFAULT_DEAL_LIST_SELECT = [
  'ID',
  'TITLE',
  'ASSIGNED_BY_ID',
  'STAGE_ID',
  'CATEGORY_ID',
  'DATE_CREATE',
  'DATE_MODIFY',
  'SOURCE_ID',
  ROLETA_DEAL_FIELD,
  ...BITRIX_DEAL_LIST_SELECT,
] as const

/** Campos mínimos para agregar volume por roleta (sem nomes de usuário / kanban). */
const ROLETA_STATS_DEAL_SELECT = [
  'ID',
  'ASSIGNED_BY_ID',
  'CATEGORY_ID',
  ROLETA_DEAL_FIELD,
  GERAL_ENTRADA_DATE_FIELD,
  'DATE_CREATE',
] as const

/** Campos usados pela visão geral; exclui o conteúdo operacional do Kanban. */
const OVERVIEW_DEAL_SELECT = [
  'ID',
  'ASSIGNED_BY_ID',
  'STAGE_ID',
  'CATEGORY_ID',
  'DATE_CREATE',
  'SOURCE_ID',
  ROLETA_DEAL_FIELD,
  GERAL_NOVOS_LEADS_DATE_FIELD,
  GERAL_ENTRADA_DATE_FIELD,
] as const

export interface RoletaDealSnapshot {
  assigned_by_id: string
  category_id: string
  roleta: string
}

export type BitrixWebhookRef = string | string[]

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
  DATE_MODIFY?: string
  MODIFY_BY_ID?: string | number
  MOVED_TIME?: string
  SOURCE_ID?: string
  [ROLETA_DEAL_FIELD]?: string
  [key: string]: string | number | undefined
}

export function getBitrixWebhookUrl(): string {
  return '/api/bitrix/'
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchUserNames(
  webhookUrl: BitrixWebhookRef,
  userIds: string[]
): Promise<Record<string, string>> {
  if (userIds.length === 0) return {}

  const names: Record<string, string> = {}

  for (let i = 0; i < userIds.length; i += 50) {
    const chunk = userIds.slice(i, i + 50)
    const data = await bitrixPost<{ result: { ID: string; NAME: string; LAST_NAME: string }[] }>(
      webhookUrl,
      'user.get',
      {
        filter: { '=ID': chunk },
        select: ['ID', 'NAME', 'LAST_NAME'],
        start: -1,
      }
    )

    for (const user of data.result ?? []) {
      const fullName = [user.NAME, user.LAST_NAME].filter(Boolean).join(' ').trim()
      names[user.ID] = fullName || `Usuário #${user.ID}`
    }
  }

  return names
}

export async function fetchStageDefinitions(
  webhookUrl: BitrixWebhookRef,
  categoryId: string
): Promise<BitrixStageDefinition[]> {
  const data = await bitrixPost<{
    result: {
      STATUS_ID: string
      NAME: string
      SORT?: string
      COLOR?: string
      SEMANTICS?: string | null
      EXTRA?: { SEMANTICS?: string }
    }[]
  }>(webhookUrl, 'crm.dealcategory.stage.list', {
    id: categoryId,
    start: -1,
  })

  return (data.result ?? [])
    .map((stage) => {
      const semantics = stage.SEMANTICS ?? stage.EXTRA?.SEMANTICS ?? null
      return {
        statusId: stage.STATUS_ID,
        name: stage.NAME,
        sort: Number(stage.SORT ?? 0),
        categoryId,
        semantics,
        color: normalizeStageColor(stage.COLOR, semantics),
      }
    })
    .sort((a, b) => a.sort - b.sort)
}

export async function fetchStageLabels(
  webhookUrl: BitrixWebhookRef,
  categoryId: string
): Promise<Record<string, string>> {
  const json = await bitrixPost<{
    result: { STATUS_ID: string; NAME: string }[]
  }>(webhookUrl, 'crm.status.list', {
    filter: { '=ENTITY_ID': `DEAL_STAGE_${categoryId}` },
    start: -1,
  })

  const labels: Record<string, string> = {}
  for (const stage of json.result ?? []) {
    labels[stage.STATUS_ID] = stage.NAME
  }
  return labels
}

export async function fetchSourceLabels(webhookUrl: BitrixWebhookRef): Promise<Record<string, string>> {
  const data = await bitrixPost<{ result: { STATUS_ID: string; NAME: string }[] }>(
    webhookUrl,
    'crm.status.list',
    { filter: { '=ENTITY_ID': 'SOURCE' }, start: -1 }
  )

  const labels: Record<string, string> = {}
  for (const source of data.result ?? []) {
    labels[source.STATUS_ID] = source.NAME
  }
  return labels
}

function buildDealListFilter(
  params: DealQueryParams,
  dateFilter: Record<string, unknown>
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    ...dateFilter,
    ...(params.categoryIds.length === 1
      ? { '=CATEGORY_ID': params.categoryIds[0] }
      : { '@CATEGORY_ID': params.categoryIds }),
  }

  if (params.assignedByIds?.length) {
    if (params.assignedByIds.length === 1) {
      filter['=ASSIGNED_BY_ID'] = params.assignedByIds[0]
    } else {
      filter['@ASSIGNED_BY_ID'] = params.assignedByIds
    }
  }

  if (params.roletaTitle) {
    filter[`=${ROLETA_DEAL_FIELD}`] = params.roletaTitle
  }

  return filter
}

function getDealDateFilterVariants(params: DealQueryParams): Record<string, unknown>[] {
  const categoryId = params.categoryIds.length === 1 ? params.categoryIds[0] : ''

  return categoryId
    ? buildDealDateFilterVariants(categoryId, params.dateFrom, params.dateTo)
    : [
        {
          '>=DATE_CREATE': params.dateFrom,
          '<=DATE_CREATE': params.dateTo,
        },
      ]
}

async function countDealsForFilter(
  webhookUrl: BitrixWebhookRef,
  params: DealQueryParams,
  dateFilter: Record<string, unknown>
): Promise<number> {
  const deals = await fetchDealPagesForFilter(webhookUrl, params, dateFilter, ['ID'])
  return deals.length
}

export async function countDeals(
  webhookUrl: BitrixWebhookRef,
  params: DealQueryParams
): Promise<number> {
  const variants = getDealDateFilterVariants(params)
  let total = 0

  for (const variant of variants) {
    total += await countDealsForFilter(webhookUrl, params, variant)
    if (variants.length > 1) {
      await sleep(150)
    }
  }

  return total
}

function normalizeDeal(
  raw: BitrixDealRaw,
  userNames: Record<string, string>,
  userToTeamName: Record<string, string>,
  userToDiretoriaName: Record<string, string>
): BitrixLead {
  const assignedId = String(raw.ASSIGNED_BY_ID ?? '')
  const modifyById = String(raw.MODIFY_BY_ID ?? '')
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
    date_modify: String(raw.DATE_MODIFY ?? ''),
    date_arrived: resolveDealArrivedAt(raw, categoryId),
    date_last_movement: resolveDealLastMovementAt(raw, categoryId),
    modified_by_id: modifyById,
    modified_by_name:
      userNames[modifyById] ?? (modifyById ? `Usuário #${modifyById}` : 'Sem registro'),
    source_id: String(raw.SOURCE_ID ?? ''),
    roleta: String(raw[ROLETA_DEAL_FIELD] ?? '').trim(),
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

async function fetchDealPagesForFilter(
  webhookUrl: BitrixWebhookRef,
  params: DealQueryParams,
  dateFilter: Record<string, unknown>,
  selectFields: readonly string[] = DEFAULT_DEAL_LIST_SELECT
): Promise<BitrixDealRaw[]> {
  const allDeals: BitrixDealRaw[] = []
  let lastId = 0

  while (allDeals.length < SAFETY_MAX_RECORDS) {
    const data = await bitrixPost<{ result: BitrixDealRaw[] }>(
      webhookUrl,
      'crm.deal.list',
      {
        filter: {
          ...buildDealListFilter(params, dateFilter),
          ...(lastId > 0 ? { '>ID': lastId } : {}),
        },
        select: [...selectFields],
        order: { ID: 'ASC' },
        start: -1,
      }
    )

    const batch = data.result ?? []
    allDeals.push(...batch)

    if (batch.length < PAGE_SIZE) break

    lastId = Math.max(...batch.map((deal) => Number(deal.ID ?? 0)).filter(Boolean))
    if (!lastId) break

    await sleep(150)
  }

  return allDeals
}

async function fetchDealPages(
  webhookUrl: BitrixWebhookRef,
  params: DealQueryParams,
  selectFields: readonly string[] = DEFAULT_DEAL_LIST_SELECT
): Promise<BitrixDealRaw[]> {
  const variants = getDealDateFilterVariants(params)

  if (variants.length === 1) {
    return fetchDealPagesForFilter(webhookUrl, params, variants[0], selectFields)
  }

  const pagesByVariant: BitrixDealRaw[][] = []
  for (const variant of variants) {
    pagesByVariant.push(
      await fetchDealPagesForFilter(webhookUrl, params, variant, selectFields)
    )
    if (variants.length > 1) await sleep(150)
  }

  return dedupeDeals(pagesByVariant.flat())
}

async function fetchDealsWithSplit(
  webhookUrl: BitrixWebhookRef,
  params: DealQueryParams,
  selectFields: readonly string[] = DEFAULT_DEAL_LIST_SELECT
): Promise<BitrixDealRaw[]> {
  return fetchDealPages(webhookUrl, params, selectFields)
}

export async function fetchBreakdownCounts(
  webhookUrl: BitrixWebhookRef,
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

  const byDiretoria = []
  for (const diretoria of org.diretorias) {
    byDiretoria.push({
      id: diretoria.id,
      name: diretoria.name,
      leads: await countUsers(diretoria.teams.flatMap((team) => team.userIds)),
    })
  }

  const byTeam = []
  for (const diretoria of org.diretorias) {
    for (const team of diretoria.teams) {
      byTeam.push({
        equipe: getTeamLabel(team),
        leads: await countUsers(team.userIds),
      })
    }
  }

  return { byDiretoria, byTeam }
}

export async function fetchLeadsFromBitrix(
  webhookUrl: BitrixWebhookRef,
  params: DealQueryParams & {
    userToTeamName?: Record<string, string>
    userToDiretoriaName?: Record<string, string>
    userNames?: Record<string, string>
    summaryOnly?: boolean
    sequentialCategories?: boolean
  }
): Promise<BitrixLead[]> {
  const userToTeamName = params.userToTeamName ?? {}
  const userToDiretoriaName = params.userToDiretoriaName ?? {}

  const fetchCategory = (categoryId: string) =>
    fetchDealsWithSplit(
      webhookUrl,
      { ...params, categoryIds: [categoryId] },
      params.summaryOnly ? OVERVIEW_DEAL_SELECT : DEFAULT_DEAL_LIST_SELECT
    )

  const rawByCategory: BitrixDealRaw[][] = []
  for (const categoryId of params.categoryIds) {
    rawByCategory.push(await fetchCategory(categoryId))
    if (params.categoryIds.length > 1) await sleep(150)
  }

  const allDeals = dedupeDeals(rawByCategory.flat())
  const userNames = { ...(params.userNames ?? {}) }
  const missingUserIds = new Set<string>()

  if (!params.summaryOnly) {
    for (const deal of allDeals) {
      for (const rawId of [deal.ASSIGNED_BY_ID, deal.MODIFY_BY_ID]) {
        const userId = String(rawId ?? '')
        if (userId && !userNames[userId]) missingUserIds.add(userId)
      }
    }

    Object.assign(
      userNames,
      await fetchUserNames(webhookUrl, [...missingUserIds])
    )
  }

  return allDeals
    .map((deal) => normalizeDeal(deal, userNames, userToTeamName, userToDiretoriaName))
    .filter((lead) =>
      isDealEntryInRange(lead.date_arrived, params.dateFrom, params.dateTo)
    )
}

export async function fetchRoletaDealSnapshots(
  webhookUrl: BitrixWebhookRef,
  params: DealQueryParams & { sequentialCategories?: boolean }
): Promise<RoletaDealSnapshot[]> {
  const fetchCategory = (categoryId: string) =>
    fetchDealsWithSplit(
      webhookUrl,
      { ...params, categoryIds: [categoryId] },
      ROLETA_STATS_DEAL_SELECT
    )

  const rawByCategory: BitrixDealRaw[][] = []
  for (const categoryId of params.categoryIds) {
    rawByCategory.push(await fetchCategory(categoryId))
    if (params.categoryIds.length > 1) await sleep(150)
  }

  const snapshots: RoletaDealSnapshot[] = []

  for (const deal of dedupeDeals(rawByCategory.flat())) {
    const categoryId = String(deal.CATEGORY_ID ?? '0')
    const dateArrived = resolveDealArrivedAt(deal, categoryId)

    if (!isDealEntryInRange(dateArrived, params.dateFrom, params.dateTo)) {
      continue
    }

    snapshots.push({
      assigned_by_id: String(deal.ASSIGNED_BY_ID ?? ''),
      category_id: categoryId,
      roleta: String(deal[ROLETA_DEAL_FIELD] ?? '').trim(),
    })
  }

  return snapshots
}

export async function fetchEsteiraCounts(
  webhookUrl: BitrixWebhookRef,
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

export async function updateDealStage(
  webhookUrl: BitrixWebhookRef,
  dealId: string,
  stageId: string
): Promise<void> {
  await bitrixPost(webhookUrl, 'crm.deal.update', {
    id: dealId,
    fields: { STAGE_ID: stageId },
  })
}

export async function updateDealAssignee(
  webhookUrl: BitrixWebhookRef,
  dealId: string,
  assignedById: string
): Promise<void> {
  await bitrixPost(webhookUrl, 'crm.deal.update', {
    id: dealId,
    fields: { ASSIGNED_BY_ID: assignedById },
  })
}

export async function updateDealAssigneesBatch(
  webhookUrl: BitrixWebhookRef,
  dealIds: string[],
  assignedById: string
): Promise<{ succeeded: string[]; failed: { dealId: string; error: string }[] }> {
  const succeeded: string[] = []
  const failed: { dealId: string; error: string }[] = []

  for (const dealId of dealIds) {
    try {
      await updateDealAssignee(webhookUrl, dealId, assignedById)
      succeeded.push(dealId)
      await sleep(120)
    } catch (error) {
      failed.push({
        dealId,
        error: error instanceof Error ? error.message : 'Erro ao transferir',
      })
    }
  }

  return { succeeded, failed }
}
