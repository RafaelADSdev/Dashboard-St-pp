import {
  ESTEIRA_ECONOMICO_ID,
  ESTEIRA_ECONOMICO_NAME,
  ESTEIRA_GERAL_ID,
  ESTEIRA_GERAL_NAME,
  isEconomicoCategory,
  isGeralCategory,
} from '@/api/bitrixConfig'
import type { BitrixStageDefinition, StageCatalog } from '@/api/bitrixStages'
import { normalizeStageId } from '@/api/bitrixStages'
import type { BitrixLead, KanbanBoard, KanbanCard, KanbanStage } from '@/api/types'

function resolveSourceLabel(sourceId: string, sourceLabels: Record<string, string>): string {
  if (!sourceId) return 'Sem origem'
  return sourceLabels[sourceId] ?? sourceId
}

function toKanbanCard(lead: BitrixLead, sourceLabels: Record<string, string>): KanbanCard {
  return {
    id: lead.id,
    title: lead.title,
    assignedById: lead.assigned_by_id,
    assignedByName: lead.assigned_by_name,
    diretoria: lead.diretoria,
    roleta: lead.roleta || 'Sem roleta',
    source: resolveSourceLabel(lead.source_id, sourceLabels),
    equipe: lead.equipe,
    dateCreate: lead.date_arrived || lead.date_create,
    dateModify: lead.date_last_movement || lead.date_modify || lead.date_create,
    modifiedByName: lead.modified_by_name,
    categoryId: lead.category_id,
  }
}

function stageShortId(stageId: string): string {
  return stageId.includes(':') ? (stageId.split(':').pop() ?? stageId) : stageId
}

function resolveStageBucket(
  stageId: string,
  stages: BitrixStageDefinition[],
  categoryId: string
): string {
  const normalized = normalizeStageId(stageId, categoryId)
  if (stages.some((stage) => stage.statusId === normalized)) return normalized

  const short = stageShortId(normalized)
  const match = stages.find((stage) => stageShortId(stage.statusId) === short)
  return match?.statusId ?? normalized
}

function buildBoard(
  leads: BitrixLead[],
  stages: BitrixStageDefinition[],
  categoryId: string,
  title: string,
  sourceLabels: Record<string, string>
): KanbanBoard {
  const cardsByStage = new Map<string, KanbanCard[]>()

  for (const stage of stages) {
    cardsByStage.set(stage.statusId, [])
  }

  for (const lead of leads) {
    const stageId = resolveStageBucket(lead.stage_id, stages, categoryId)
    const bucket = cardsByStage.get(stageId) ?? []
    bucket.push(toKanbanCard(lead, sourceLabels))
    cardsByStage.set(stageId, bucket)
  }

  const kanbanStages: KanbanStage[] = stages.map((stage) => ({
    id: stage.statusId,
    name: stage.name,
    color: stage.color,
    sort: stage.sort,
    categoryId: stage.categoryId,
    semantics: stage.semantics,
    cards: (cardsByStage.get(stage.statusId) ?? []).sort(
      (a, b) => new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime()
    ),
  }))

  return {
    categoryId,
    title,
    stages: kanbanStages,
  }
}

export function buildKanbanBoards(
  leads: BitrixLead[],
  esteira: string,
  stageCatalog: StageCatalog,
  sourceLabels: Record<string, string> = {}
): KanbanBoard[] {
  if (esteira === 'GERAL') {
    return [
      buildBoard(
        leads.filter((lead) => isGeralCategory(lead.category_id)),
        stageCatalog.geral,
        ESTEIRA_GERAL_ID,
        ESTEIRA_GERAL_NAME,
        sourceLabels
      ),
    ]
  }

  if (esteira === 'ECONOMICO') {
    return [
      buildBoard(
        leads.filter((lead) => isEconomicoCategory(lead.category_id)),
        stageCatalog.economico,
        ESTEIRA_ECONOMICO_ID,
        ESTEIRA_ECONOMICO_NAME,
        sourceLabels
      ),
    ]
  }

  return [
    buildBoard(
      leads.filter((lead) => isGeralCategory(lead.category_id)),
      stageCatalog.geral,
      ESTEIRA_GERAL_ID,
      ESTEIRA_GERAL_NAME,
      sourceLabels
    ),
    buildBoard(
      leads.filter((lead) => isEconomicoCategory(lead.category_id)),
      stageCatalog.economico,
      ESTEIRA_ECONOMICO_ID,
      ESTEIRA_ECONOMICO_NAME,
      sourceLabels
    ),
  ]
}

export function moveKanbanCard(
  boards: KanbanBoard[],
  cardId: string,
  targetStageId: string
): KanbanBoard[] {
  let movedCard: KanbanCard | null = null
  let sourceStageId: string | null = null

  const stripped = boards.map((board) => ({
    ...board,
    stages: board.stages.map((stage) => {
      const card = stage.cards.find((item) => item.id === cardId)
      if (!card) return stage
      movedCard = card
      sourceStageId = stage.id
      return {
        ...stage,
        cards: stage.cards.filter((item) => item.id !== cardId),
      }
    }),
  }))

  if (!movedCard || !sourceStageId || sourceStageId === targetStageId) {
    return boards
  }

  return stripped.map((board) => ({
    ...board,
    stages: board.stages.map((stage) =>
      stage.id === targetStageId
        ? {
            ...stage,
            cards: [
              { ...movedCard!, dateModify: new Date().toISOString() },
              ...stage.cards,
            ],
          }
        : stage
    ),
  }))
}

export function updateKanbanCardsAssignee(
  boards: KanbanBoard[],
  dealIds: string[],
  assignee: Pick<KanbanCard, 'assignedById' | 'assignedByName' | 'diretoria' | 'equipe'>
): KanbanBoard[] {
  const idSet = new Set(dealIds)

  return boards.map((board) => ({
    ...board,
    stages: board.stages.map((stage) => ({
      ...stage,
      cards: stage.cards.map((card) =>
        idSet.has(card.id)
          ? {
              ...card,
              assignedById: assignee.assignedById,
              assignedByName: assignee.assignedByName,
              diretoria: assignee.diretoria,
              equipe: assignee.equipe,
            }
          : card
      ),
    })),
  }))
}

export function updateKanbanCardAssignee(
  boards: KanbanBoard[],
  dealId: string,
  assignee: Pick<KanbanCard, 'assignedById' | 'assignedByName' | 'diretoria' | 'equipe'>
): KanbanBoard[] {
  return updateKanbanCardsAssignee(boards, [dealId], assignee)
}
