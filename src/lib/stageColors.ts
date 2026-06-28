/** Paleta compartilhada entre funil e kanban por fase */
export const STAGE_CHART_COLORS = [
  '#f59e0b',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#10b981',
  '#22c55e',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
]

export function getStageChartColor(index: number): string {
  return STAGE_CHART_COLORS[index % STAGE_CHART_COLORS.length]
}

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return hex
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
