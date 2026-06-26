import { unstable_cache } from 'next/cache'
import type { FilterParams } from '@/api/types'
import { DASHBOARD_SYNC_SECONDS } from '@/lib/syncConfig'
import { buildDashboardData } from './buildDashboardData'

export function getCachedDashboard(filters: FilterParams) {
  return unstable_cache(
    async () => buildDashboardData(filters),
    [
      'dashboard-data',
      filters.dateFrom,
      filters.dateTo,
      filters.esteira,
      filters.diretoria,
      filters.equipe,
    ],
    { revalidate: DASHBOARD_SYNC_SECONDS }
  )()
}
