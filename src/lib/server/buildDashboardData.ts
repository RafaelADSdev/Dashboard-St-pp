import { fetchBreakdownCounts, fetchEsteiraCounts, fetchLeadsFromBitrix } from '@/api/bitrix'
import { resolveRoletaTitle } from '@/api/bitrixRoletas'
import { getCategoryIdsForEsteira } from '@/api/bitrixConfig'
import type { FilterParams, LeadsDashboardData } from '@/api/types'
import { getEquipeOptions, resolveAssignedByIds } from '@/lib/orgPreview'
import { aggregateLeadsData } from '@/utils/aggregateLeads'
import { getServerBitrixWebhookUrl } from './bitrixWebhook'
import {
  getCachedOrgStructure,
  getCachedSourceLabels,
  getCachedStageCatalog,
  getCachedStuppRoletas,
} from './cachedBitrix'

export async function buildDashboardData(filters: FilterParams): Promise<LeadsDashboardData> {
  const webhookUrl = getServerBitrixWebhookUrl()
  const categoryIds = getCategoryIdsForEsteira(filters.esteira)

  const [org, stageCatalog, roletas, sourceLabels] = await Promise.all([
    getCachedOrgStructure(),
    getCachedStageCatalog(),
    getCachedStuppRoletas(),
    getCachedSourceLabels(),
  ])

  const equipeOptions = getEquipeOptions(org)
  const assignedByIds = resolveAssignedByIds(org, filters)
  const hasUserFilter = Boolean(filters.equipe || filters.diretoria)
  const roletaTitle = resolveRoletaTitle(roletas, filters.roleta)
  const hasRoletaFilter = Boolean(filters.roleta)

  if ((hasUserFilter && assignedByIds.length === 0) || (hasRoletaFilter && !roletaTitle)) {
    return aggregateLeadsData(
      [],
      filters,
      stageCatalog,
      { geral: 0, economico: 0, total: 0 },
      org,
      equipeOptions,
      undefined,
      sourceLabels
    )
  }

  const queryBase = {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    categoryIds,
    assignedByIds,
    roletaTitle,
  }

  const [bitrixLeads, counts, breakdownCounts] = await Promise.all([
    fetchLeadsFromBitrix(webhookUrl, {
      ...queryBase,
      userToTeamName: org.userToTeamName,
      userToDiretoriaName: org.userToDiretoriaName,
    }),
    fetchEsteiraCounts(
      webhookUrl,
      filters.dateFrom,
      filters.dateTo,
      assignedByIds,
      roletaTitle
    ),
    fetchBreakdownCounts(
      webhookUrl,
      { ...queryBase, scopeUserIds: assignedByIds },
      org
    ),
  ])

  const esteiraCounts =
    filters.esteira === 'GERAL'
      ? { geral: counts.geral, economico: 0, total: counts.geral }
      : filters.esteira === 'ECONOMICO'
        ? { geral: 0, economico: counts.economico, total: counts.economico }
        : counts

  return aggregateLeadsData(
    bitrixLeads,
    filters,
    stageCatalog,
    esteiraCounts,
    org,
    equipeOptions,
    breakdownCounts,
    sourceLabels
  )
}
