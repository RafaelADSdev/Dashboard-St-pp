import { unstable_cache } from 'next/cache'
import type { FilterParams } from '@/api/types'
import { DASHBOARD_SYNC_SECONDS } from '@/lib/syncConfig'
import { buildDashboardData } from './buildDashboardData'
import {
  buildDistributedCacheKey,
  withDistributedCache,
} from './distributedCache'

export function getCachedDashboard(filters: FilterParams) {
  const distributedKey = buildDistributedCacheKey(
    'bitrix:dashboard:v14',
    filters
  )

  return unstable_cache(
    async () =>
      withDistributedCache(
        distributedKey,
        DASHBOARD_SYNC_SECONDS,
        () => buildDashboardData(filters)
      ),
    [
      'dashboard-data-v13',
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
