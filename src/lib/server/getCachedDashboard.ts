import { unstable_cache } from 'next/cache'
import type { FilterParams } from '@/api/types'
import { DASHBOARD_SYNC_SECONDS } from '@/lib/syncConfig'
import { buildDashboardData } from './buildDashboardData'
import type { DashboardDataView } from './buildDashboardData'
import {
  buildDistributedCacheKey,
  withDistributedCache,
} from './distributedCache'

export function getCachedDashboard(
  filters: FilterParams,
  view: DashboardDataView = 'full'
) {
  const distributedKey = buildDistributedCacheKey(
    'bitrix:dashboard:v22',
    { filters, view }
  )

  return unstable_cache(
    async () =>
      withDistributedCache(
        distributedKey,
        DASHBOARD_SYNC_SECONDS,
        () => buildDashboardData(filters, view)
      ),
    [
      'dashboard-data-v22',
      view,
      filters.dateFrom,
      filters.dateTo,
      filters.esteira,
      filters.diretoria,
      filters.equipe,
      filters.corretor,
      filters.roleta,
    ],
    { revalidate: DASHBOARD_SYNC_SECONDS }
  )()
}
