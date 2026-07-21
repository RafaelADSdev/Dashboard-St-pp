import { NextResponse, type NextRequest } from 'next/server'
import type { FilterParams } from '@/api/types'
import { DASHBOARD_QUERY_CACHE_SECONDS } from '@/lib/syncConfig'
import { getCachedRoletasDashboard } from '@/lib/server/getCachedRoletasDashboard'
import { bitrixRouteErrorStatus } from '@/lib/server/bitrixPaused'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseFilters(searchParams: URLSearchParams): FilterParams | null {
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''

  if (!dateFrom || !dateTo) return null

  return {
    dateFrom,
    dateTo,
    esteira: 'TODAS',
    diretoria: searchParams.get('diretoria') ?? '',
    equipe: searchParams.get('equipe') ?? '',
    corretor: searchParams.get('corretor') ?? '',
    roleta: '',
  }
}

export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams)

  if (!filters) {
    return NextResponse.json(
      { error: 'Informe dateFrom e dateTo' },
      { status: 400 }
    )
  }

  try {
    const data = await getCachedRoletasDashboard(filters)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `private, max-age=${DASHBOARD_QUERY_CACHE_SECONDS}, stale-while-revalidate=${DASHBOARD_QUERY_CACHE_SECONDS}`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar roletas'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
