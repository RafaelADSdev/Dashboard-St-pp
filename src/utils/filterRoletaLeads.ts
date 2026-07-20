import { isRoletaAtivaForFilter, type RoletaOperationalStatus } from '@/lib/roletaStatus'

export function normalizeRoletaTitleKey(title: string): string {
  return title.trim().toLowerCase()
}

export function buildActiveRoletaTitleKeys(
  roletas: Array<{ title: string; isActive?: boolean; status?: RoletaOperationalStatus }>
): Set<string> {
  return new Set(
    roletas
      .filter((roleta) => isRoletaAtivaForFilter(roleta))
      .map((roleta) => normalizeRoletaTitleKey(roleta.title))
      .filter(Boolean)
  )
}

export function filterLeadsByActiveRoletas<T extends { roleta: string }>(
  leads: T[],
  roletas: Array<{ title: string; isActive?: boolean; status?: RoletaOperationalStatus }>
): T[] {
  const activeKeys = buildActiveRoletaTitleKeys(roletas)
  if (activeKeys.size === 0) return []

  return leads.filter((lead) => {
    const key = normalizeRoletaTitleKey(lead.roleta)
    return Boolean(key) && activeKeys.has(key)
  })
}
