import { fetchLeadsFromBitrix } from '@/api/bitrix'
import { isRoletaFilterActiveOnly, resolveRoletaTitle } from '@/api/bitrixRoletas'
import { getCategoryIdsForEsteira } from '@/api/bitrixConfig'
import type { FilterParams, LeadsDashboardData } from '@/api/types'
import { getEquipeOptions, resolveAssignedByIds } from '@/lib/orgPreview'
import { getRoletaTitleKeysForDiretoria } from '@/lib/diretoriaScope'
import { aggregateLeadsData } from '@/utils/aggregateLeads'
import { countCorretoresAtivosRoleta } from '@/utils/countCorretoresAtivosRoleta'
import { filterLeadsByActiveRoletas } from '@/utils/filterRoletaLeads'
import { getDealsBitrixWebhookCandidates, hasSplitBitrixWebhooks } from './bitrixWebhook'
import {
  getCachedOrgStructure,
  getCachedRoletaCorretoresMembership,
  getCachedSourceLabels,
  getCachedStageCatalog,
  getCachedStuppRoletasCatalog,
} from './cachedBitrix'

export type DashboardDataView = 'full' | 'overview'

async function loadDashboardMetadata() {
  const org = await getCachedOrgStructure()
  const stageCatalog = await getCachedStageCatalog()
  const roletasCatalog = await getCachedStuppRoletasCatalog()
  const roletas = roletasCatalog.filter((roleta) => roleta.isActive)
  const roletaMembership = await getCachedRoletaCorretoresMembership()
  const sourceLabels = await getCachedSourceLabels()

  return {
    org,
    stageCatalog,
    roletas,
    roletasCatalog,
    roletaMembership,
    sourceLabels,
  }
}

export async function buildDashboardData(
  filters: FilterParams,
  view: DashboardDataView = 'full'
): Promise<LeadsDashboardData> {
  const dealsWebhooks = getDealsBitrixWebhookCandidates()
  const categoryIds = getCategoryIdsForEsteira(filters.esteira)
  const sequentialCategories = !hasSplitBitrixWebhooks()

  const { org, stageCatalog, roletas, roletasCatalog, roletaMembership, sourceLabels } =
    await loadDashboardMetadata()

  const equipeOptions = getEquipeOptions(org)
  const assignedByIds = resolveAssignedByIds(org, {
    diretoria: filters.diretoria,
    equipe: filters.equipe,
    corretor: filters.corretor,
  })
  const hasUserFilter = Boolean(filters.equipe || filters.diretoria || filters.corretor)
  const somenteRoletasAtivas = isRoletaFilterActiveOnly(filters.roleta)
  const roletaTitle = resolveRoletaTitle(roletas, filters.roleta)
  const hasRoletaFilter = Boolean(filters.roleta) && !somenteRoletasAtivas
  const corretoresAtivosRoleta = countCorretoresAtivosRoleta(
    roletasCatalog,
    roletaMembership.membershipByRoletaId,
    {
      stuppUserIds: new Set(org.allUserIds),
      filters: {
        diretoria: filters.diretoria,
        equipe: filters.equipe,
        corretor: filters.corretor,
        roleta: filters.roleta,
      },
      org,
    }
  )

  if ((hasUserFilter && assignedByIds.length === 0) || (hasRoletaFilter && !roletaTitle)) {
    return {
      ...aggregateLeadsData(
        [],
        filters,
        stageCatalog,
        org,
        equipeOptions,
        sourceLabels,
        undefined,
        { includeOperationalDetails: view === 'full' }
      ),
      corretoresAtivosRoleta,
    }
  }

  const bitrixLeads = await fetchLeadsFromBitrix(dealsWebhooks, {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    categoryIds,
    assignedByIds: hasUserFilter ? assignedByIds : undefined,
    roletaTitle,
    userToTeamName: org.userToTeamName,
    userToDiretoriaName: org.userToDiretoriaName,
    userNames: org.userToName,
    summaryOnly: view === 'overview',
    sequentialCategories,
  })

  const scopedLeads = somenteRoletasAtivas
    ? filterLeadsByActiveRoletas(bitrixLeads, roletasCatalog)
    : bitrixLeads

  const allowedRoletaTitleKeys = filters.diretoria
    ? getRoletaTitleKeysForDiretoria(
        roletasCatalog,
        roletaMembership.membershipByRoletaId,
        org,
        filters.diretoria
      )
    : undefined

  return {
    ...aggregateLeadsData(
      scopedLeads,
      filters,
      stageCatalog,
      org,
      equipeOptions,
      sourceLabels,
      allowedRoletaTitleKeys,
      { includeOperationalDetails: view === 'full' }
    ),
    corretoresAtivosRoleta,
  }
}
