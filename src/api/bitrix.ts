import type { BitrixLead } from './types'
import { ESTEIRA_ECONOMICO_ID, ESTEIRA_GERAL_ID } from './bitrixConfig'

export type { BitrixLead }

const PAGE_SIZE = 50
const MAX_RECORDS = 500

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

export async function countDeals(
  webhookUrl: string,
  params: { dateFrom: string; dateTo: string; categoryIds: string[]; assignedByIds?: string[] }
): Promise<number> {
  const filter: Record<string, unknown> = {
    '>=DATE_CREATE': params.dateFrom,
    '<=DATE_CREATE': params.dateTo,
    '@CATEGORY_ID': params.categoryIds,
  }

  if (params.assignedByIds?.length) {
    filter['@ASSIGNED_BY_ID'] = params.assignedByIds
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

  return {
    id: String(raw.ID ?? ''),
    title: String(raw.TITLE ?? ''),
    assigned_by_id: assignedId,
    assigned_by_name: userNames[assignedId] ?? (assignedId ? `Usuário #${assignedId}` : 'Sem responsável'),
    equipe: userToTeamName[assignedId] ?? 'Sem equipe',
    diretoria: userToDiretoriaName[assignedId] ?? 'Outros',
    stage_id: String(raw.STAGE_ID ?? ''),
    category_id: String(raw.CATEGORY_ID ?? '0'),
    date_create: String(raw.DATE_CREATE ?? ''),
    source_id: String(raw.SOURCE_ID ?? ''),
  }
}

export async function fetchLeadsFromBitrix(
  webhookUrl: string,
  params: {
    dateFrom: string
    dateTo: string
    categoryIds: string[]
    assignedByIds?: string[]
    userToTeamName?: Record<string, string>
    userToDiretoriaName?: Record<string, string>
  }
): Promise<BitrixLead[]> {
  const userToTeamName = params.userToTeamName ?? {}
  const userToDiretoriaName = params.userToDiretoriaName ?? {}

  const allDeals: BitrixDealRaw[] = []
  const userIds = new Set<string>()
  let start = 0
  let hasMore = true

  while (hasMore && allDeals.length < MAX_RECORDS) {
    const filter: Record<string, unknown> = {
      '>=DATE_CREATE': params.dateFrom,
      '<=DATE_CREATE': params.dateTo,
      '@CATEGORY_ID': params.categoryIds,
    }

    if (params.assignedByIds?.length) {
      filter['@ASSIGNED_BY_ID'] = params.assignedByIds
    }

    const data = await bitrixPost<{ result: BitrixDealRaw[] }>(webhookUrl, 'crm.deal.list', {
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
    })

    const batch = data.result ?? []
    allDeals.push(...batch)

    for (const deal of batch) {
      if (deal.ASSIGNED_BY_ID) {
        userIds.add(String(deal.ASSIGNED_BY_ID))
      }
    }

    if (batch.length < PAGE_SIZE) {
      hasMore = false
    } else {
      start += PAGE_SIZE
      await sleep(150)
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
  assignedByIds?: string[]
) {
  const baseParams = { dateFrom, dateTo, assignedByIds }
  const [geral, economico] = await Promise.all([
    countDeals(webhookUrl, { ...baseParams, categoryIds: [ESTEIRA_GERAL_ID] }),
    countDeals(webhookUrl, { ...baseParams, categoryIds: [ESTEIRA_ECONOMICO_ID] }),
  ])
  return { geral, economico, total: geral + economico }
}
