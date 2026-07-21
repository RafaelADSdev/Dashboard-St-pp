import type { RoletaLeadSummary } from '@/api/types'
import { getLeadsAtivos } from '@/utils/operationalAlert'

export function normalizeRoletaLeadSummary(
  item: Partial<RoletaLeadSummary> & { roleta: string }
): RoletaLeadSummary {
  const count = item.count ?? 0
  const perdidos = item.perdidos ?? 0

  return {
    roleta: item.roleta,
    count,
    perdidos,
    ativos: item.ativos ?? getLeadsAtivos(count, perdidos),
  }
}

export function normalizeRoletaLeadSummaries(
  items: Array<Partial<RoletaLeadSummary> & { roleta: string }>
): RoletaLeadSummary[] {
  return items.map(normalizeRoletaLeadSummary)
}
