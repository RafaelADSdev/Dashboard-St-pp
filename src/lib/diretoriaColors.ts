import { CHART_BAR_FILL } from '@/lib/stageColors'

/** Cores institucionais das diretorias (por Nogueira). */
export const DIRETORIA_BRAND_COLORS = {
  HENRIQUE: '#c0a46b',
  STUPP: '#dddddd',
  TALMON: '#994d4d',
  SANTOS: '#ff9400',
  SEVERO: '#2900e0',
  GEORGII: '#040404',
  MONTEIRO: '#04747b',
} as const

function normalizeDiretoriaKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .trim()
}

export function getDiretoriaColor(name: string): string {
  const normalized = normalizeDiretoriaKey(name)

  const direct = DIRETORIA_BRAND_COLORS[normalized as keyof typeof DIRETORIA_BRAND_COLORS]
  if (direct) return direct

  for (const [key, color] of Object.entries(DIRETORIA_BRAND_COLORS)) {
    if (normalized.includes(key)) return color
  }

  return CHART_BAR_FILL
}
