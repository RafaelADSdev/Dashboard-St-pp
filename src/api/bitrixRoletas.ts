import type { StuppOrgStructure } from '@/api/bitrixDepartments'
import {
  classifyRoletaStatus,
  isKanbanActiveRoleta,
  type RoletaOperationalStatus,
  type RoletaStageInfo,
} from '@/lib/roletaStatus'
import { resolveRoletaLideranca } from '@/lib/resolveRoletaLideranca'

/**
 * Roletas (SPA Bitrix) — kanban da superintendência:
 * https://hubnogueira.bitrix24.com.br/crm/type/129/kanban/category/0/
 * Nota: no REST API o categoryId deste funil é 20 (não 0).
 */
export const ROLETA_ENTITY_TYPE_ID = 129
export const ROLETA_ENTITY_CATEGORY_ID =
  process.env.NEXT_PUBLIC_BITRIX_ROLETA_CATEGORY_ID ?? '20'
export const ROLETA_STAGE_ENTITY_ID = `DYNAMIC_${ROLETA_ENTITY_TYPE_ID}_STAGE_${ROLETA_ENTITY_CATEGORY_ID}`
export const ROLETA_STAGE_PREFIX = `DT${ROLETA_ENTITY_TYPE_ID}_${ROLETA_ENTITY_CATEGORY_ID}`
export const ROLETA_DEAL_FIELD = 'UF_CRM_1734703374'
const PAGE_SIZE = 50

export interface StuppRoleta {
  id: string
  title: string
  isActive: boolean
  status: RoletaOperationalStatus
  stageId: string
  stageName?: string
  createdAt?: string
  assignedById?: string
  liderancaId: string
  liderancaName: string
}

interface BitrixRoletaItem {
  id: number | string
  title: string
  stageId?: string
  createdTime?: string
  assignedById?: number | string
}

import { bitrixPost } from '@/api/bitrixRequest'
import type { BitrixWebhookRef } from '@/api/bitrix'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isStuppRoletaTitle(title: string): boolean {
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return normalized.includes('stupp')
}

export function isInactiveRoletaTitle(title: string): boolean {
  const normalized = title
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (
    /^\[(?:inativ[ao]?|descartad[ao]?|exclu[ií]d[ao]?|acabad[ao]?|conclu[ií]d[ao]?|teste)/i.test(
      normalized
    )
  ) {
    return true
  }

  return /\binativ[ao]?|desativad|descartad|exclu[ií]d|acabad|conclu[ií]d|encerrad|finalizad|suspens[ao]?|\bteste\b/i.test(
    normalized
  )
}

async function fetchStagesFromEntity(
  webhookUrl: BitrixWebhookRef,
  entityId: string
): Promise<RoletaStageInfo[]> {
  const data = await bitrixPost<{
    result?: {
      STATUS_ID?: string
      NAME?: string
      SORT?: string | number
      SEMANTICS?: string | null
      EXTRA?: { SEMANTICS?: string | null }
    }[]
  }>(webhookUrl, 'crm.status.entity.items', { entityId, start: -1 })

  return (data.result ?? [])
    .filter((stage) => Boolean(stage.STATUS_ID))
    .map((stage) => ({
      id: stage.STATUS_ID!,
      name: stage.NAME ?? stage.STATUS_ID!,
      sort: Number(stage.SORT ?? 0),
      semantics: stage.SEMANTICS ?? stage.EXTRA?.SEMANTICS ?? null,
    }))
}

async function fetchStagesFromStatusList(
  webhookUrl: BitrixWebhookRef,
  entityId: string
): Promise<RoletaStageInfo[]> {
  const data = await bitrixPost<{
    result?: {
      STATUS_ID?: string
      NAME?: string
      SORT?: string | number
      SEMANTICS?: string | null
    }[]
  }>(webhookUrl, 'crm.status.list', {
    filter: { '=ENTITY_ID': entityId },
    order: { SORT: 'ASC' },
    start: -1,
  })

  return (data.result ?? [])
    .filter((stage) => Boolean(stage.STATUS_ID))
    .map((stage) => ({
      id: stage.STATUS_ID!,
      name: stage.NAME ?? stage.STATUS_ID!,
      sort: Number(stage.SORT ?? 0),
      semantics: stage.SEMANTICS ?? null,
    }))
}

export async function fetchRoletaStages(
  webhookUrl: BitrixWebhookRef
): Promise<Map<string, RoletaStageInfo>> {
  const stages = new Map<string, RoletaStageInfo>()

  for (const entityId of [ROLETA_STAGE_ENTITY_ID, ROLETA_STAGE_PREFIX]) {
    try {
      const items = await fetchStagesFromEntity(webhookUrl, entityId)
      for (const stage of items) {
        stages.set(stage.id, stage)
      }
      if (stages.size > 0) break
    } catch {
      try {
        const items = await fetchStagesFromStatusList(webhookUrl, entityId)
        for (const stage of items) {
          stages.set(stage.id, stage)
        }
        if (stages.size > 0) break
      } catch {
        // fallback no próximo entityId
      }
    }
  }

  return stages
}

function enrichRoleta(
  item: BitrixRoletaItem,
  org: StuppOrgStructure,
  stages: Map<string, RoletaStageInfo>,
  leadMovementByRoletaId: Map<string, boolean>
): StuppRoleta {
  const stageId = String(item.stageId ?? '')
  const stage = stages.get(stageId)
  const lideranca = resolveRoletaLideranca(
    {
      title: item.title,
      assignedById: item.assignedById ? String(item.assignedById) : undefined,
    },
    org
  )

  const status = classifyRoletaStatus({
    title: item.title,
    stageId,
    stageName: stage?.name,
    stageSemantics: stage?.semantics,
    createdAt: item.createdTime,
    hasLeadMovement: leadMovementByRoletaId.get(String(item.id)) ?? false,
  })

  return {
    id: String(item.id),
    title: item.title.trim(),
    isActive: isKanbanActiveRoleta({ status, stageId }),
    status,
    stageId,
    stageName: stage?.name,
    createdAt: item.createdTime,
    assignedById: item.assignedById ? String(item.assignedById) : undefined,
    liderancaId: lideranca.id,
    liderancaName: lideranca.name,
  }
}

export async function fetchStuppRoletasCatalog(
  webhookUrl: BitrixWebhookRef,
  org: StuppOrgStructure,
  leadMovementByRoletaId: Map<string, boolean> = new Map()
): Promise<StuppRoleta[]> {
  const all: BitrixRoletaItem[] = []
  let lastId = 0

  while (true) {
    const data = await bitrixPost<{
      result?: { items?: BitrixRoletaItem[] }
    }>(webhookUrl, 'crm.item.list', {
      entityTypeId: ROLETA_ENTITY_TYPE_ID,
      filter: {
        '=categoryId': Number(ROLETA_ENTITY_CATEGORY_ID),
        ...(lastId > 0 ? { '>id': lastId } : {}),
      },
      select: ['id', 'title', 'stageId', 'createdTime', 'assignedById'],
      order: { id: 'ASC' },
      start: -1,
    })

    const batch = data.result?.items ?? []
    all.push(...batch)

    if (batch.length < PAGE_SIZE) break
    lastId = Math.max(...batch.map((item) => Number(item.id)).filter(Boolean))
    if (!lastId) break
    await sleep(100)
  }

  const stages = await fetchRoletaStages(webhookUrl)

  return all
    .filter((item) => isStuppRoletaTitle(item.title) && !isInactiveRoletaTitle(item.title))
    .map((item) => enrichRoleta(item, org, stages, leadMovementByRoletaId))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
}

export async function fetchStuppRoletas(
  webhookUrl: BitrixWebhookRef,
  org?: StuppOrgStructure
): Promise<StuppRoleta[]> {
  if (!org) {
    const legacy = await fetchLegacyActiveRoletas(webhookUrl)
    return legacy
  }

  const catalog = await fetchStuppRoletasCatalog(webhookUrl, org)
  return catalog.filter((item) => isKanbanActiveRoleta(item))
}

async function fetchLegacyActiveRoletas(webhookUrl: BitrixWebhookRef): Promise<StuppRoleta[]> {
  const all: BitrixRoletaItem[] = []
  let lastId = 0

  while (true) {
    const data = await bitrixPost<{
      result?: { items?: BitrixRoletaItem[] }
    }>(webhookUrl, 'crm.item.list', {
      entityTypeId: ROLETA_ENTITY_TYPE_ID,
      filter: {
        '=categoryId': Number(ROLETA_ENTITY_CATEGORY_ID),
        ...(lastId > 0 ? { '>id': lastId } : {}),
      },
      select: ['id', 'title', 'stageId'],
      order: { id: 'ASC' },
      start: -1,
    })

    const batch = data.result?.items ?? []
    all.push(...batch)

    if (batch.length < PAGE_SIZE) break
    lastId = Math.max(...batch.map((item) => Number(item.id)).filter(Boolean))
    if (!lastId) break
    await sleep(100)
  }

  return all
    .filter((item) => isStuppRoletaTitle(item.title) && !isInactiveRoletaTitle(item.title))
    .map((item) => ({
      id: String(item.id),
      title: item.title.trim(),
      isActive: true,
      status: 'ativa' as const,
      stageId: String(item.stageId ?? ''),
      liderancaId: '__sem_lideranca__',
      liderancaName: 'Sem liderança',
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
}

export function resolveRoletaTitle(
  roletas: StuppRoleta[],
  roletaId: string
): string | undefined {
  if (!roletaId) return undefined
  return roletas.find((roleta) => roleta.id === roletaId)?.title
}
