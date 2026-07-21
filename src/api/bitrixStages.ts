import { isEconomicoCategory, isGeralCategory } from '@/api/bitrixConfig'

export interface BitrixStageDefinition {
  statusId: string
  name: string
  sort: number
  categoryId: string
  semantics: string | null
  color: string
}

export interface StageCatalog {
  geral: BitrixStageDefinition[]
  economico: BitrixStageDefinition[]
  labels: Record<string, string>
}

export function normalizeStageId(stageId: string, categoryId: string): string {
  const trimmed = stageId.trim()
  if (!trimmed) return trimmed
  if (trimmed.includes(':')) return trimmed
  return `C${categoryId}:${trimmed}`
}

export function buildStageLabels(definitions: BitrixStageDefinition[]): Record<string, string> {
  const labels: Record<string, string> = {}

  for (const stage of definitions) {
    const normalized = normalizeStageId(stage.statusId, stage.categoryId)
    labels[normalized] = stage.name
    labels[stage.statusId] = stage.name

    const shortId = normalized.includes(':') ? normalized.split(':')[1] : normalized
    if (shortId) {
      labels[`cat:${stage.categoryId}:${shortId}`] = stage.name
      if (!labels[shortId]) {
        labels[shortId] = stage.name
      }
    }
  }

  return labels
}

function stageIdsMatch(
  definitionStageId: string,
  leadStageId: string,
  categoryId: string
): boolean {
  const normalizedLeadStageId = normalizeStageId(leadStageId, categoryId)
  const normalizedDefinitionStageId = normalizeStageId(definitionStageId, categoryId)

  if (normalizedDefinitionStageId === normalizedLeadStageId) return true
  if (definitionStageId === leadStageId) return true

  const leadShortId = normalizedLeadStageId.includes(':')
    ? normalizedLeadStageId.split(':')[1]
    : normalizedLeadStageId
  const definitionShortId = normalizedDefinitionStageId.includes(':')
    ? normalizedDefinitionStageId.split(':')[1]
    : normalizedDefinitionStageId

  return Boolean(
    (leadShortId && definitionShortId && leadShortId === definitionShortId) ||
      (leadShortId && leadShortId === definitionStageId) ||
      (definitionShortId && definitionShortId === leadStageId)
  )
}

export function resolveStageLabel(
  stageId: string,
  labels: Record<string, string>,
  categoryId?: string
): string {
  if (labels[stageId]) return labels[stageId]

  if (categoryId) {
    const normalized = normalizeStageId(stageId, categoryId)
    if (labels[normalized]) return labels[normalized]

    const shortId = normalized.includes(':') ? normalized.split(':')[1] : normalized
    if (shortId) {
      const scoped = `cat:${categoryId}:${shortId}`
      if (labels[scoped]) return labels[scoped]
      if (labels[shortId]) return labels[shortId]
    }
  }

  return stageId
}

export function normalizeStageColor(color?: string | null, semantics?: string | null): string {
  if (color?.trim()) {
    const trimmed = color.trim()
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  }

  if (semantics === 'S') return '#22c55e'
  if (semantics === 'F') return '#ef4444'
  return '#64748b'
}

export function groupByStageOrdered(
  leads: { stage_id: string; category_id?: string }[],
  definitions: BitrixStageDefinition[],
  labels: Record<string, string>,
  categoryId: string
): { x: string; y: number }[] {
  const result = definitions.map((stage) => ({
    x: stage.name,
    y: leads.filter((lead) => stageIdsMatch(stage.statusId, lead.stage_id, categoryId)).length,
  }))

  const unknownCounts = new Map<string, number>()

  for (const lead of leads) {
    const matched = definitions.some((stage) =>
      stageIdsMatch(stage.statusId, lead.stage_id, categoryId)
    )
    if (matched) continue

    const label = resolveStageLabel(lead.stage_id, labels, categoryId)
    unknownCounts.set(label, (unknownCounts.get(label) ?? 0) + 1)
  }

  for (const [label, count] of unknownCounts) {
    if (count === 0) continue
    result.push({ x: label, y: count })
  }

  return result
}

export function isLeadInFailureStage(
  lead: { stage_id: string; category_id?: string },
  definitions: BitrixStageDefinition[]
): boolean {
  const categoryId = lead.category_id ?? ''
  const stage = definitions.find((item) =>
    stageIdsMatch(item.statusId, lead.stage_id, categoryId)
  )

  return stage?.semantics === 'F'
}

export const LOST_KPI_STAGE_NAME_ECONOMICO = 'Perda'
export const LOST_KPI_STAGE_NAME_GERAL = 'Negocios Perdidos'

function normalizeStageName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isLeadInNamedStage(
  lead: { stage_id: string; category_id?: string },
  definitions: BitrixStageDefinition[],
  stageName: string
): boolean {
  const targetName = normalizeStageName(stageName)
  if (!targetName) return false

  const categoryId = lead.category_id ?? ''

  return definitions.some(
    (stage) =>
      normalizeStageName(stage.name) === targetName &&
      stageIdsMatch(stage.statusId, lead.stage_id, categoryId)
  )
}

function resolveLostStageDefinitions(
  definitions: BitrixStageDefinition[],
  stageName: string,
  pipeline: 'economico' | 'geral'
): BitrixStageDefinition[] {
  const targetName = normalizeStageName(stageName)
  const exactMatches = definitions.filter(
    (stage) => normalizeStageName(stage.name) === targetName
  )

  if (exactMatches.length > 0) return exactMatches

  if (pipeline === 'economico') {
    return definitions.filter((stage) => normalizeStageName(stage.name).includes('perda'))
  }

  return definitions.filter((stage) => {
    const name = normalizeStageName(stage.name)
    return name.includes('negocios perdidos') || name.includes('perdido')
  })
}

export function isLeadInLostKpiStage(
  lead: { stage_id: string; category_id?: string },
  catalog: StageCatalog,
  economicoCategoryId: string,
  geralCategoryId: string
): boolean {
  const categoryId = String(lead.category_id ?? '')

  if (isEconomicoCategory(categoryId)) {
    const lostDefinitions = resolveLostStageDefinitions(
      catalog.economico,
      LOST_KPI_STAGE_NAME_ECONOMICO,
      'economico'
    )
    return lostDefinitions.some((stage) =>
      stageIdsMatch(stage.statusId, lead.stage_id, economicoCategoryId)
    )
  }

  if (isGeralCategory(categoryId)) {
    const lostDefinitions = resolveLostStageDefinitions(
      catalog.geral,
      LOST_KPI_STAGE_NAME_GERAL,
      'geral'
    )
    return lostDefinitions.some((stage) =>
      stageIdsMatch(stage.statusId, lead.stage_id, geralCategoryId)
    )
  }

  return false
}

export function countLostLeadsInPipeline(
  leads: { stage_id: string }[],
  definitions: BitrixStageDefinition[],
  stageName: string,
  categoryId: string,
  pipeline: 'economico' | 'geral'
): number {
  const lostDefinitions = resolveLostStageDefinitions(definitions, stageName, pipeline)
  if (lostDefinitions.length === 0) return 0

  return leads.filter((lead) =>
    lostDefinitions.some((stage) => stageIdsMatch(stage.statusId, lead.stage_id, categoryId))
  ).length
}

export function countLostLeadsFromFunnel(
  funnel: { x: string; y: number }[],
  stageName: string,
  pipeline: 'economico' | 'geral'
): number {
  const targetName = normalizeStageName(stageName)

  return funnel.reduce((total, item) => {
    const name = normalizeStageName(item.x)
    const matches =
      name === targetName ||
      (pipeline === 'economico' ? name.includes('perda') : name.includes('perdido'))

    return matches ? total + item.y : total
  }, 0)
}

export function groupByStageBreakdown(
  leads: { stage_id: string }[],
  definitions: BitrixStageDefinition[],
  labels: Record<string, string>,
  categoryId: string
): { stage: string; count: number }[] {
  return groupByStageOrdered(leads, definitions, labels, categoryId).map(({ x, y }) => ({
    stage: x,
    count: y,
  }))
}
