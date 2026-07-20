import { differenceInHours } from 'date-fns'
import type { KanbanBoard, KanbanCard } from '@/api/types'
import { computeDuration, parseBitrixDate } from '@/utils/leadTiming'

export type OperationalAlertLevel = 'ok' | 'warning' | 'urgent' | 'critical'

export interface OperationalAlert {
  level: OperationalAlertLevel
  days: number
  shortLabel: string
  title: string
  badgeClass: string
}

const ALERT_STYLES: Record<
  OperationalAlertLevel,
  Pick<OperationalAlert, 'badgeClass'>
> = {
  ok: {
    badgeClass:
      'bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/30',
  },
  warning: {
    badgeClass:
      'bg-amber-50 text-amber-900 ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-500/30',
  },
  urgent: {
    badgeClass:
      'bg-orange-50 text-orange-900 ring-orange-200/80 dark:bg-orange-500/15 dark:text-orange-100 dark:ring-orange-500/30',
  },
  critical: {
    badgeClass:
      'bg-red-50 text-red-800 ring-red-200/80 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-500/30',
  },
}

export const OPERATIONAL_ALERT_WARNING_DAYS = 3

function resolveLevel(days: number): OperationalAlertLevel {
  if (days >= 15) return 'critical'
  if (days >= 8) return 'urgent'
  if (days >= 3) return 'warning'
  return 'ok'
}

function formatShortLabel(days: number, hours?: number): string {
  if (days === 0) {
    if (!hours || hours === 0) return '<1h'
    return `${hours}h`
  }
  return `${days}d`
}

function formatTitle(days: number, label: string): string {
  if (days === 0) return `Sem atualização: ${label}`
  return `Parado há ${label}`
}

export function getStaleDaysFromCard(card: KanbanCard, reference = new Date()): number {
  return computeDuration(card.dateModify, reference).days
}

export function getOperationalAlert(
  days: number,
  options?: { hours?: number; referenceLabel?: string }
): OperationalAlert {
  const level = resolveLevel(days)
  const duration =
    options?.referenceLabel ??
    (days === 0 && options?.hours
      ? options.hours === 1
        ? '1 hora'
        : `${options.hours} horas`
      : days === 1
        ? '1 dia'
        : `${days} dias`)

  return {
    level,
    days,
    shortLabel: formatShortLabel(days, options?.hours),
    title: formatTitle(days, duration),
    badgeClass: ALERT_STYLES[level].badgeClass,
  }
}

export function getCardOperationalAlert(card: KanbanCard, reference = new Date()): OperationalAlert {
  const metrics = computeDuration(card.dateModify, reference)
  const from = parseBitrixDate(card.dateModify)
  const hours =
    metrics.days === 0 && from ? Math.max(0, differenceInHours(reference, from)) : undefined

  return getOperationalAlert(metrics.days, {
    hours,
    referenceLabel: metrics.label,
  })
}

export function isOperationalAlert(card: KanbanCard, reference = new Date()): boolean {
  return getStaleDaysFromCard(card, reference) >= OPERATIONAL_ALERT_WARNING_DAYS
}

export function countKanbanAlerts(boards: KanbanBoard[], reference = new Date()): number {
  let count = 0
  for (const board of boards) {
    for (const stage of board.stages) {
      for (const card of stage.cards) {
        if (isOperationalAlert(card, reference)) count++
      }
    }
  }
  return count
}

export function getKanbanBoardsMaxStaleDays(boards: KanbanBoard[], reference = new Date()): number {
  let max = 0
  for (const board of boards) {
    for (const stage of board.stages) {
      for (const card of stage.cards) {
        max = Math.max(max, getStaleDaysFromCard(card, reference))
      }
    }
  }
  return max
}

/** Nível de urgência da esteira a partir do lead mais parado (entre os em alerta). */
export function getKanbanBoardsAlertLevel(
  boards: KanbanBoard[],
  reference = new Date()
): OperationalAlertLevel {
  return resolveLevel(getKanbanBoardsMaxStaleDays(boards, reference))
}

export function getColumnMaxStaleDays(cards: KanbanCard[], reference = new Date()): number {
  if (cards.length === 0) return 0
  return Math.max(...cards.map((card) => getStaleDaysFromCard(card, reference)))
}

export function compareCardsByStaleness(a: KanbanCard, b: KanbanCard, reference = new Date()): number {
  const staleDiff = getStaleDaysFromCard(b, reference) - getStaleDaysFromCard(a, reference)
  if (staleDiff !== 0) return staleDiff
  return new Date(a.dateModify).getTime() - new Date(b.dateModify).getTime()
}

export const KPI_VALUE_ALERT_CLASSES: Record<OperationalAlertLevel, string> = {
  ok: '',
  warning: 'text-amber-800 dark:text-amber-200',
  urgent: 'text-orange-700 dark:text-orange-300',
  critical: 'text-red-700 dark:text-red-300',
}

export const KPI_BORDER_ALERT_CLASSES: Record<OperationalAlertLevel, string> = {
  ok: '',
  warning: 'border-amber-200/90 dark:border-amber-500/35',
  urgent: 'border-orange-200/90 dark:border-orange-500/35',
  critical: 'border-red-200/90 dark:border-red-500/35',
}

export const KPI_HINT_ALERT_CLASSES: Record<OperationalAlertLevel, string> = {
  ok: 'text-indigo/55 dark:text-cream/55',
  warning: 'text-amber-800 dark:text-amber-200',
  urgent: 'text-orange-700 dark:text-orange-300',
  critical: 'text-red-700 dark:text-red-300',
}

export interface FunnelBottleneck {
  stageName: string
  count: number
  sharePercent: number
  level: OperationalAlertLevel
  index: number
}

export interface FunnelStage {
  x: string
  y: number
}

function resolveShareAlertLevel(sharePercent: number): OperationalAlertLevel {
  if (sharePercent >= 65) return 'critical'
  if (sharePercent >= 50) return 'urgent'
  if (sharePercent >= 35) return 'warning'
  return 'ok'
}

export function getFunnelBottleneck(stages: FunnelStage[]): FunnelBottleneck | null {
  const active = stages.filter((stage) => stage.y > 0)
  if (active.length === 0) return null

  let peak = active[0]
  let peakIndex = stages.findIndex((stage) => stage.x === peak.x && stage.y === peak.y)

  for (let index = 0; index < active.length; index += 1) {
    const stage = active[index]
    if (stage.y > peak.y) {
      peak = stage
      peakIndex = stages.findIndex((item) => item.x === stage.x && item.y === stage.y)
    }
  }

  const total = active.reduce((sum, stage) => sum + stage.y, 0)
  const sharePercent = total > 0 ? Math.round((peak.y / total) * 100) : 0

  return {
    stageName: peak.x,
    count: peak.y,
    sharePercent,
    level: resolveShareAlertLevel(sharePercent),
    index: peakIndex >= 0 ? peakIndex : 0,
  }
}

export function formatFunnelBottleneckDescription(bottleneck: FunnelBottleneck | null, fallback: string): string {
  if (!bottleneck || bottleneck.level === 'ok') return fallback
  return `Gargalo: ${bottleneck.stageName} · ${bottleneck.count} leads (${bottleneck.sharePercent}%)`
}

export function getLostLeadsKpiAlert(lost: number, total: number): {
  level: OperationalAlertLevel
  hint?: string
} {
  if (lost <= 0) return { level: 'ok' }

  const ratio = total > 0 ? lost / total : 1

  if (lost >= 15 || ratio >= 0.2) {
    return {
      level: 'critical',
      hint: total > 0 ? `· ${Math.round(ratio * 100)}% do volume` : undefined,
    }
  }

  if (lost >= 8 || ratio >= 0.12) {
    return {
      level: 'urgent',
      hint: total > 0 ? `· ${Math.round(ratio * 100)}% do volume` : undefined,
    }
  }

  if (lost >= 3 || ratio >= 0.05) {
    return {
      level: 'warning',
      hint: total > 0 ? `· ${Math.round(ratio * 100)}% do volume` : undefined,
    }
  }

  return { level: 'ok' }
}

export const FUNNEL_BOTTLENECK_COLORS: Record<OperationalAlertLevel, string> = {
  ok: '#6366f1',
  warning: '#d97706',
  urgent: '#ea580c',
  critical: '#dc2626',
}
