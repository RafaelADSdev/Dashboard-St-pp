import { fetchEsteiraCounts, fetchLeadsFromBitrix } from '@/api/bitrix'
import { getCategoryIdsForEsteira } from '@/api/bitrixConfig'
import type { FilterParams, LeadsDashboardData } from '@/api/types'
import { getEquipeOptions, resolveAssignedByIds } from '@/lib/orgPreview'
import { aggregateLeadsData } from '@/utils/aggregateLeads'
import { getServerBitrixWebhookUrl } from './bitrixWebhook'
import { getCachedOrgStructure, getCachedStageLabels } from './cachedBitrix'

export async function buildDashboardData(filters: FilterParams): Promise<LeadsDashboardData> {
  const webhookUrl = getServerBitrixWebhookUrl()
  const categoryIds = getCategoryIdsForEsteira(filters.esteira)

  const [org, stageLabels] = await Promise.all([
    getCachedOrgStructure(),
    getCachedStageLabels(),
  ])

  const equipeOptions = getEquipeOptions(org)
  const assignedByIds = resolveAssignedByIds(org, filters)
  const hasUserFilter = Boolean(filters.equipe || filters.diretoria)

  if (hasUserFilter && assignedByIds.length === 0) {
    return aggregateLeadsData(
      [],
      filters,
      stageLabels,
      { geral: 0, economico: 0, total: 0 },
      org,
      equipeOptions
    )
  }

  const [bitrixLeads, counts] = await Promise.all([
    fetchLeadsFromBitrix(webhookUrl, {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      categoryIds,
      assignedByIds,
      userToTeamName: org.userToTeamName,
      userToDiretoriaName: org.userToDiretoriaName,
    }),
    fetchEsteiraCounts(webhookUrl, filters.dateFrom, filters.dateTo, assignedByIds),
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
    stageLabels,
    esteiraCounts,
    org,
    equipeOptions
  )
}
