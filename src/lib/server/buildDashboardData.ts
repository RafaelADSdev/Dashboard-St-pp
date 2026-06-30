import { fetchLeadsFromBitrix } from '@/api/bitrix'
import { resolveRoletaTitle } from '@/api/bitrixRoletas'
import { getCategoryIdsForEsteira } from '@/api/bitrixConfig'
import type { FilterParams, LeadsDashboardData } from '@/api/types'
import { getEquipeOptions, resolveAssignedByIds } from '@/lib/orgPreview'
import { aggregateLeadsData } from '@/utils/aggregateLeads'
import { getDealsBitrixWebhookCandidates, hasSplitBitrixWebhooks } from './bitrixWebhook'
import {
  getCachedOrgStructure,
  getCachedSourceLabels,
  getCachedStageCatalog,
  getCachedStuppRoletas,
} from './cachedBitrix'

async function loadDashboardMetadata() {
  if (hasSplitBitrixWebhooks()) {
    const [org, stageCatalog, roletas, sourceLabels] = await Promise.all([
      getCachedOrgStructure(),
      getCachedStageCatalog(),
      getCachedStuppRoletas(),
      getCachedSourceLabels(),
    ])
    return { org, stageCatalog, roletas, sourceLabels }
  }

  const org = await getCachedOrgStructure()
  const stageCatalog = await getCachedStageCatalog()
  const roletas = await getCachedStuppRoletas()
  const sourceLabels = await getCachedSourceLabels()

  return { org, stageCatalog, roletas, sourceLabels }
}

export async function buildDashboardData(filters: FilterParams): Promise<LeadsDashboardData> {
  const dealsWebhooks = getDealsBitrixWebhookCandidates()
  const categoryIds = getCategoryIdsForEsteira(filters.esteira)
  const sequentialCategories = !hasSplitBitrixWebhooks()

  const { org, stageCatalog, roletas, sourceLabels } = await loadDashboardMetadata()

  const equipeOptions = getEquipeOptions(org)
  const assignedByIds = resolveAssignedByIds(org, {
    diretoria: filters.diretoria,
    equipe: filters.equipe,
    corretor: filters.corretor,
  })
  const hasUserFilter = Boolean(filters.equipe || filters.diretoria || filters.corretor)
  const roletaTitle = resolveRoletaTitle(roletas, filters.roleta)
  const hasRoletaFilter = Boolean(filters.roleta)

  if ((hasUserFilter && assignedByIds.length === 0) || (hasRoletaFilter && !roletaTitle)) {
    return aggregateLeadsData([], filters, stageCatalog, org, equipeOptions, sourceLabels)
  }

  const bitrixLeads = await fetchLeadsFromBitrix(dealsWebhooks, {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    categoryIds,
    assignedByIds: hasUserFilter ? assignedByIds : undefined,
    roletaTitle,
    userToTeamName: org.userToTeamName,
    userToDiretoriaName: org.userToDiretoriaName,
    sequentialCategories,
  })

  return aggregateLeadsData(
    bitrixLeads,
    filters,
    stageCatalog,
    org,
    equipeOptions,
    sourceLabels
  )
}
