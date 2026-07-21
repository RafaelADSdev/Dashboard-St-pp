import { unstable_cache } from 'next/cache'
import type { FilterParams } from '@/api/types'
import { getCategoryIdsForEsteira } from '@/api/bitrixConfig'
import { DASHBOARD_QUERY_CACHE_SECONDS } from '@/lib/syncConfig'
import { resolveAssignedByIds } from '@/lib/orgPreview'
import {
  aggregateRoletasStats,
  buildRoletasDashboardFromCatalog,
  mergeCatalogWithLeadCounts,
} from './buildRoletasData'
import {
  fetchSyncedLeads,
  getBitrixSyncState,
  getSyncedBitrixMetadata,
} from './supabaseBitrixData'
import {
  buildDistributedCacheKey,
  withDistributedCache,
} from './distributedCache'

export async function getCachedRoletasDashboard(filters: FilterParams) {
  const syncState = await getBitrixSyncState()
  const syncVersion = syncState.completed_at ?? 'not-synced'
  const distributedKey = buildDistributedCacheKey(
    'bitrix:roletas-dashboard:v8',
    { filters, syncVersion }
  )

  return unstable_cache(
    async () =>
      withDistributedCache(
        distributedKey,
        DASHBOARD_QUERY_CACHE_SECONDS,
        async () => {
          const { roletasCatalog: roletas, org } = await getSyncedBitrixMetadata()

          const catalogDashboard = buildRoletasDashboardFromCatalog(roletas)

          if (roletas.length === 0) {
            return catalogDashboard
          }

          const assignedByIds = resolveAssignedByIds(org, {
            diretoria: filters.diretoria,
            equipe: filters.equipe,
            corretor: filters.corretor,
          })
          const hasUserFilter = Boolean(filters.equipe || filters.diretoria || filters.corretor)
          const leads = await fetchSyncedLeads(
            filters,
            getCategoryIdsForEsteira('TODAS'),
            org,
            { assignedByIds: hasUserFilter ? assignedByIds : undefined }
          )
          const leadCounts = aggregateRoletasStats(
            roletas,
            leads.map((lead) => ({
              assigned_by_id: lead.assigned_by_id,
              category_id: lead.category_id,
              roleta: lead.roleta,
            })),
            new Set(assignedByIds),
            assignedByIds,
            filters
          )

          return {
            ...catalogDashboard,
            totalLeads: leadCounts.totalLeads,
            roletas: mergeCatalogWithLeadCounts(roletas, leadCounts.roletas),
          }
        }
      ),
    [
      'roletas-dashboard-v7',
      filters.dateFrom,
      filters.dateTo,
      filters.diretoria,
      filters.equipe,
      filters.corretor,
      syncVersion,
    ],
    { revalidate: DASHBOARD_QUERY_CACHE_SECONDS }
  )()
}
