import type { FilterParams } from '@/api/types'
import { DASHBOARD_QUERY_CACHE_SECONDS } from '@/lib/syncConfig'
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
    'bitrix:dashboard:v27',
    { filters, view }
  )

  return withDistributedCache(
    distributedKey,
    DASHBOARD_QUERY_CACHE_SECONDS,
    () => buildDashboardData(filters, view)
  )
}
