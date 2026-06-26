import { unstable_cache } from 'next/cache'
import type { FilterParams } from '@/api/types'
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
    { revalidate: 60 * 5 }
  )()
}
