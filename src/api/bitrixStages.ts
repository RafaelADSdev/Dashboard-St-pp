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
    labels[stage.statusId] = stage.name

    const shortId = stage.statusId.includes(':')
      ? stage.statusId.split(':')[1]
      : stage.statusId

    if (shortId && !labels[shortId]) {
      labels[shortId] = stage.name
    }
  }

  return labels
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
  const countsByStatusId: Record<string, number> = {}

  for (const lead of leads) {
    const normalized = normalizeStageId(lead.stage_id, categoryId)
    countsByStatusId[normalized] = (countsByStatusId[normalized] ?? 0) + 1
  }

  const knownIds = new Set(definitions.map((stage) => stage.statusId))
  const result = definitions.map((stage) => ({
    x: stage.name,
    y: countsByStatusId[stage.statusId] ?? 0,
  }))

  for (const [stageId, count] of Object.entries(countsByStatusId)) {
    if (knownIds.has(stageId) || count === 0) continue
    result.push({
      x: labels[stageId] ?? stageId,
      y: count,
    })
  }

  return result
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
