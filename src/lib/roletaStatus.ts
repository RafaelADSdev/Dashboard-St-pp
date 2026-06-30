import { isInactiveRoletaTitle } from '@/api/bitrixRoletas'

export type RoletaOperationalStatus = 'ativa' | 'nova' | 'suspensa'

/** Colunas do kanban Bitrix (SPA entity 129). */
export const ROLETA_BITRIX_STAGE_NAMES = {
  nova: 'Nova Roleta',
  ativa: 'Ativar Roleta',
  suspensa: 'Suspender Roleta',
  concluida: 'Roleta concluida',
  cancelada: 'Roleta Cancelada',
} as const

export const ROLETA_KANBAN_ACTIVE_STAGE_SUFFIX = 'PREPARATION'

export interface RoletaStageInfo {
  id: string
  name: string
  sort?: number
  semantics?: string | null
}

function normalizeStageName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function resolveStatusFromBitrixStageName(
  stageName?: string
): RoletaOperationalStatus | null {
  if (!stageName?.trim()) return null

  const normalized = normalizeStageName(stageName)

  if (normalized === normalizeStageName(ROLETA_BITRIX_STAGE_NAMES.nova)) return 'nova'
  if (normalized === normalizeStageName(ROLETA_BITRIX_STAGE_NAMES.ativa)) return 'ativa'
  if (normalized === normalizeStageName(ROLETA_BITRIX_STAGE_NAMES.suspensa)) return 'suspensa'
  if (normalized === normalizeStageName(ROLETA_BITRIX_STAGE_NAMES.concluida)) return 'suspensa'
  if (normalized === normalizeStageName(ROLETA_BITRIX_STAGE_NAMES.cancelada)) return 'suspensa'

  return null
}

const SUSPENSA_STAGE_PATTERN =
  /\bsuspens|inativ|desativ|descart|exclu[ií]d|arquiv|encerrad|cancelad/i
const NOVA_STAGE_PATTERN = /\bnova?\s+roleta\b|\bnova?s?\b|criad|rascunho|configur/i
const ATIVA_STAGE_PATTERN = /\bativ(ar)?\s+roleta\b|\bativ|operacional|em uso|distribui/i

export function isKanbanActiveRoleta(input: {
  status: RoletaOperationalStatus
  stageId?: string
}): boolean {
  const stageId = String(input.stageId ?? '')
  if (stageId.endsWith(`:${ROLETA_KANBAN_ACTIVE_STAGE_SUFFIX}`)) return true
  return input.status === 'ativa'
}

function resolveStatusFromStageId(stageId: string): RoletaOperationalStatus | null {
  const suffix = stageId.includes(':') ? stageId.split(':').pop() ?? '' : stageId

  if (suffix === 'NEW') return 'nova'
  if (suffix === ROLETA_KANBAN_ACTIVE_STAGE_SUFFIX) return 'ativa'
  if (suffix === 'CLIENT') return 'suspensa'
  if (suffix === 'SUCCESS' || suffix === 'FAIL') return 'suspensa'

  return null
}

export function classifyRoletaStatus(input: {
  title: string
  stageId?: string
  stageName?: string
  stageSemantics?: string | null
  createdAt?: string
  hasLeadMovement?: boolean
}): RoletaOperationalStatus {
  const fromBitrixStage = resolveStatusFromBitrixStageName(input.stageName)
  if (fromBitrixStage) return fromBitrixStage

  const stageId = String(input.stageId ?? '')
  const fromStageId = resolveStatusFromStageId(stageId)
  if (fromStageId) return fromStageId

  const stageSuffix = stageId.includes(':') ? stageId.split(':').pop() ?? '' : stageId
  const stageLabel = `${input.stageName ?? ''} ${stageId}`.trim()

  if (
    isInactiveRoletaTitle(input.title) ||
    SUSPENSA_STAGE_PATTERN.test(stageLabel) ||
    input.stageSemantics === 'F' ||
    input.stageSemantics === 'FAILURE' ||
    /:FAIL$|:LOSE$|:LOST$/i.test(stageId)
  ) {
    return 'suspensa'
  }

  if (stageSuffix === 'NEW' || NOVA_STAGE_PATTERN.test(stageLabel)) {
    return 'nova'
  }

  if (ATIVA_STAGE_PATTERN.test(stageLabel)) {
    return 'ativa'
  }

  return 'suspensa'
}

export const ROLETA_STATUS_LABELS: Record<RoletaOperationalStatus, string> = {
  ativa: 'Ativa',
  nova: 'Nova',
  suspensa: 'Suspensa',
}

export const ROLETA_KANBAN_COLUMN_ORDER = ['nova', 'ativa', 'suspensa'] as const

export const ROLETA_KANBAN_COLUMNS: {
  status: (typeof ROLETA_KANBAN_COLUMN_ORDER)[number]
  label: string
  headerClass: string
}[] = [
  { status: 'nova', label: ROLETA_BITRIX_STAGE_NAMES.nova, headerClass: 'bg-sky-500' },
  { status: 'ativa', label: ROLETA_BITRIX_STAGE_NAMES.ativa, headerClass: 'bg-emerald-500' },
  { status: 'suspensa', label: ROLETA_BITRIX_STAGE_NAMES.suspensa, headerClass: 'bg-orange-500' },
]

export const ROLETA_STATUS_ORDER: RoletaOperationalStatus[] = [...ROLETA_KANBAN_COLUMN_ORDER]

export function resolveRoletaOptionStatus(input: {
  status?: RoletaOperationalStatus
  isActive?: boolean
}): RoletaOperationalStatus {
  if (input.status) return input.status
  return input.isActive ? 'ativa' : 'suspensa'
}

export function isRoletaAtivaForFilter(input: {
  status?: RoletaOperationalStatus
  isActive?: boolean
}): boolean {
  return resolveRoletaOptionStatus(input) === 'ativa'
}
