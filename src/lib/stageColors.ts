/**
 * Paleta unificada de gráficos — escala indigo institucional (HubON).
 * Cor semântica (âmbar → vermelho) fica reservada a alertas operacionais.
 */

export const CHART_INDIGO_SCALE = [
  '#212842',
  '#2a3252',
  '#343b56',
  '#4e5672',
  '#5c6378',
  '#6b7389',
  '#7a8499',
  '#8991a8',
] as const

/** @deprecated Use CHART_INDIGO_SCALE — mantido para kanban e funil por índice de etapa. */
export const STAGE_CHART_COLORS: readonly string[] = CHART_INDIGO_SCALE

export const CHART_SERIES_COLORS = {
  economico: '#212842',
  geral: '#4e5672',
} as const

export const CHART_BAR_FILL = '#212842'

export function getStageChartColor(index: number): string {
  return CHART_INDIGO_SCALE[index % CHART_INDIGO_SCALE.length]
}

/** Barras ranqueadas: maior valor = tom mais escuro da escala. */
export function getRankingBarColor(value: number, maxValue: number): string {
  if (maxValue <= 0) return CHART_INDIGO_SCALE[0]

  const ratio = Math.min(1, Math.max(0, value / maxValue))
  const scaleIndex = Math.round((1 - ratio) * (CHART_INDIGO_SCALE.length - 1))
  return CHART_INDIGO_SCALE[scaleIndex]
}

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return hex
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
