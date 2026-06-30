import { isEconomicoCategory, isGeralCategory } from '@/api/bitrixConfig'
import { fetchRoletaDealSnapshots, type RoletaDealSnapshot } from '@/api/bitrix'
import type { StuppRoleta } from '@/api/bitrixRoletas'
import type { FilterParams, RoletaStat, RoletasDashboardData } from '@/api/types'
import { collectLiderancaOptions, SEM_LIDERANCA_ID } from '@/lib/resolveRoletaLideranca'
import { resolveAssignedByIds } from '@/lib/orgPreview'
import type { StuppOrgStructure } from '@/api/bitrixDepartments'

function normalizeRoletaKey(title: string): string {
  return title.trim().toLowerCase()
}

function buildEmptyStat(roleta: StuppRoleta): RoletaStat {
  return {
    id: roleta.id,
    title: roleta.title,
    status: roleta.status,
    liderancaId: roleta.liderancaId,
    liderancaName: roleta.liderancaName,
    totalLeads: 0,
    geralLeads: 0,
    economicoLeads: 0,
  }
}

export function aggregateRoletasStats(
  roletas: StuppRoleta[],
  snapshots: RoletaDealSnapshot[],
  allowedUserIds: Set<string>,
  assignedByIds: string[],
  filters: FilterParams
): RoletasDashboardData {
  const titleToId = new Map(
    roletas.map((roleta) => [normalizeRoletaKey(roleta.title), roleta.id])
  )

  const counts = new Map<string, RoletaStat>()

  for (const roleta of roletas) {
    counts.set(roleta.id, buildEmptyStat(roleta))
  }

  let totalLeads = 0

  for (const snapshot of snapshots) {
    if (!allowedUserIds.has(snapshot.assigned_by_id)) {
      continue
    }

    totalLeads += 1
    const roletaTitle = snapshot.roleta.trim()
    const roletaId = roletaTitle
      ? (titleToId.get(normalizeRoletaKey(roletaTitle)) ?? null)
      : null

    if (!roletaId) continue

    const stat = counts.get(roletaId)
    if (!stat) continue

    stat.totalLeads += 1
    if (isGeralCategory(snapshot.category_id)) stat.geralLeads += 1
    if (isEconomicoCategory(snapshot.category_id)) stat.economicoLeads += 1
  }

  const roletaList = [...counts.values()].sort(
    (a, b) => b.totalLeads - a.totalLeads || a.title.localeCompare(b.title, 'pt-BR')
  )

  const hasUserFilter = Boolean(filters.equipe || filters.diretoria || filters.corretor)
  if (hasUserFilter && assignedByIds.length === 0) {
    return buildRoletasDashboard(roletas.map(buildEmptyStat))
  }

  return buildRoletasDashboard(roletaList, totalLeads)
}

function buildRoletasDashboard(roletaList: RoletaStat[], totalLeads = 0): RoletasDashboardData {
  const activeRoletas = roletaList.filter((item) => item.status === 'ativa').length
  const novasRoletas = roletaList.filter((item) => item.status === 'nova').length
  const suspensasRoletas = roletaList.filter((item) => item.status === 'suspensa').length

  return {
    totalLeads,
    activeRoletas,
    novasRoletas,
    suspensasRoletas,
    roletas: roletaList,
    liderancas: collectLiderancaOptions(
      roletaList.map((item) => ({ id: item.liderancaId, name: item.liderancaName }))
    ),
  }
}

export function buildRoletasDashboardFromCatalog(roletas: StuppRoleta[]): RoletasDashboardData {
  return buildRoletasDashboard(roletas.map(buildEmptyStat))
}

export async function buildRoletasLeadCounts(
  webhookUrlOrCandidates: string | string[],
  filters: FilterParams,
  org: StuppOrgStructure,
  roletas: StuppRoleta[],
  categoryIds: string[],
  sequentialCategories = false
): Promise<Pick<RoletasDashboardData, 'totalLeads' | 'roletas'>> {
  const assignedByIds = resolveAssignedByIds(org, {
    diretoria: filters.diretoria,
    equipe: filters.equipe,
    corretor: filters.corretor,
  })

  const allowedUserIds = new Set(assignedByIds)
  const hasUserFilter = Boolean(filters.equipe || filters.diretoria || filters.corretor)

  if (hasUserFilter && assignedByIds.length === 0) {
    const empty = roletas.map(buildEmptyStat)
    return { totalLeads: 0, roletas: empty }
  }

  const snapshots = await fetchRoletaDealSnapshots(webhookUrlOrCandidates, {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    categoryIds,
    assignedByIds: hasUserFilter ? assignedByIds : undefined,
    sequentialCategories,
  })

  const aggregated = aggregateRoletasStats(
    roletas,
    snapshots,
    allowedUserIds,
    assignedByIds,
    filters
  )

  return {
    totalLeads: aggregated.totalLeads,
    roletas: aggregated.roletas,
  }
}

export async function buildRoletasData(
  webhookUrlOrCandidates: string | string[],
  filters: FilterParams,
  org: StuppOrgStructure,
  roletas: StuppRoleta[],
  categoryIds: string[]
): Promise<RoletasDashboardData> {
  const leadCounts = await buildRoletasLeadCounts(
    webhookUrlOrCandidates,
    filters,
    org,
    roletas,
    categoryIds
  )

  return {
    ...buildRoletasDashboardFromCatalog(roletas),
    totalLeads: leadCounts.totalLeads,
    roletas: mergeCatalogWithLeadCounts(roletas, leadCounts.roletas),
  }
}

export function mergeCatalogWithLeadCounts(
  catalog: StuppRoleta[],
  stats: RoletaStat[]
): RoletaStat[] {
  const statsById = new Map(stats.map((item) => [item.id, item]))

  return catalog.map((roleta) => {
    const stat = statsById.get(roleta.id)
    return (
      stat ?? {
        id: roleta.id,
        title: roleta.title,
        status: roleta.status,
        liderancaId: roleta.liderancaId,
        liderancaName: roleta.liderancaName,
        totalLeads: 0,
        geralLeads: 0,
        economicoLeads: 0,
      }
    )
  })
}

export function catalogToRoletaStats(roletas: StuppRoleta[]): RoletaStat[] {
  return roletas.map(buildEmptyStat)
}

export function emptyLiderancaFallback() {
  return { id: SEM_LIDERANCA_ID, name: 'Sem liderança' }
}
