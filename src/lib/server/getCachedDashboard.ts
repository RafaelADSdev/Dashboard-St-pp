import type { FilterParams } from '@/api/types'
import { DASHBOARD_QUERY_CACHE_SECONDS } from '@/lib/syncConfig'
import { buildDashboardData } from './buildDashboardData'
import type { DashboardDataView } from './buildDashboardData'
import {
  buildDistributedCacheKey,
  withDistributedCache,
} from './distributedCache'
import { getBitrixSyncState } from './supabaseBitrixData'

export async function getCachedDashboard(
  filters: FilterParams,
  view: DashboardDataView = 'full'
) {
  const syncState = await getBitrixSyncState()
  const syncVersion = syncState.completed_at ?? 'not-synced'
  const distributedKey = buildDistributedCacheKey(
    'bitrix:dashboard:v27',
    { filters, view, syncVersion }
  )

  return withDistributedCache(
    distributedKey,
    DASHBOARD_QUERY_CACHE_SECONDS,
    () => buildDashboardData(filters, view)
  )
}
