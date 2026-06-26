import { useQuery } from '@tanstack/react-query'
import {
  fetchEsteiraCounts,
  fetchLeadsFromBitrix,
  fetchStageLabels,
  getBitrixWebhookUrl,
} from '@/api/bitrix'
import {
  ESTEIRA_ECONOMICO_ID,
  ESTEIRA_GERAL_ID,
  getCategoryIdsForEsteira,
} from '@/api/bitrixConfig'
import type { FilterParams, LeadsDashboardData } from '@/api/types'
import { aggregateLeadsData } from '@/utils/aggregateLeads'
import { fetchStuppOrgStructure } from '@/api/bitrixDepartments'
import { getEquipeOptions, resolveAssignedByIds } from '@/hooks/useStuppOrg'

export function useLeadsData(filters: FilterParams) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async (): Promise<LeadsDashboardData> => {
      const webhookUrl = getBitrixWebhookUrl()
      const categoryIds = getCategoryIdsForEsteira(filters.esteira)

      const org = await fetchStuppOrgStructure(webhookUrl)
      const equipeOptions = getEquipeOptions(org)
      const assignedByIds = resolveAssignedByIds(org, filters)

      const [bitrixLeads, stageLabelsGeral, stageLabelsEconomico, counts] =
        await Promise.all([
          fetchLeadsFromBitrix(webhookUrl, {
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            categoryIds,
            assignedByIds: org.allUserIds,
            userToTeamName: org.userToTeamName,
            userToDiretoriaName: org.userToDiretoriaName,
          }),
          fetchStageLabels(webhookUrl, ESTEIRA_GERAL_ID),
          fetchStageLabels(webhookUrl, ESTEIRA_ECONOMICO_ID),
          fetchEsteiraCounts(
            webhookUrl,
            filters.dateFrom,
            filters.dateTo,
            assignedByIds.length ? assignedByIds : org.allUserIds
          ),
        ])

      const stageLabels = { ...stageLabelsGeral, ...stageLabelsEconomico }

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
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    retry: 2,
    retryDelay: 5000,
  })
}
