import { unstable_cache } from 'next/cache'
import type { FilterParams } from '@/api/types'
import { getCategoryIdsForEsteira } from '@/api/bitrixConfig'
import { DASHBOARD_SYNC_SECONDS } from '@/lib/syncConfig'
import {
  buildRoletasDashboardFromCatalog,
  buildRoletasLeadCounts,
  mergeCatalogWithLeadCounts,
} from './buildRoletasData'
import { getDealsBitrixWebhookCandidates, hasSplitBitrixWebhooks } from './bitrixWebhook'
import { getCachedOrgStructure, getCachedStuppRoletasCatalog } from './cachedBitrix'

export function getCachedRoletasDashboard(filters: FilterParams) {
  return unstable_cache(
    async () => {
      const [roletas, org] = await Promise.all([
        getCachedStuppRoletasCatalog(),
        getCachedOrgStructure(),
      ])

      const catalogDashboard = buildRoletasDashboardFromCatalog(roletas)

      if (roletas.length === 0) {
        return catalogDashboard
      }

      const leadCounts = await buildRoletasLeadCounts(
        getDealsBitrixWebhookCandidates(),
        filters,
        org,
        roletas,
        getCategoryIdsForEsteira('TODAS'),
        !hasSplitBitrixWebhooks()
      )

      return {
        ...catalogDashboard,
        totalLeads: leadCounts.totalLeads,
        roletas: mergeCatalogWithLeadCounts(roletas, leadCounts.roletas),
      }
    },
    [
      'roletas-dashboard-v7',
      filters.dateFrom,
      filters.dateTo,
      filters.diretoria,
      filters.equipe,
      filters.corretor,
    ],
    { revalidate: DASHBOARD_SYNC_SECONDS }
  )()
}
