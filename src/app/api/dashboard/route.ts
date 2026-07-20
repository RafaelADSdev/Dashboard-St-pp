import { NextResponse, type NextRequest } from 'next/server'
import type { FilterParams } from '@/api/types'
import { DASHBOARD_SYNC_SECONDS } from '@/lib/syncConfig'
import { getCachedDashboard } from '@/lib/server/getCachedDashboard'
import {
  BITRIX_PAUSED_MESSAGE,
  bitrixRouteErrorStatus,
  isBitrixPaused,
} from '@/lib/server/bitrixPaused'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseFilters(searchParams: URLSearchParams): FilterParams | null {
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''

  if (!dateFrom || !dateTo) return null

  return {
    dateFrom,
    dateTo,
    esteira: searchParams.get('esteira') ?? 'TODAS',
    diretoria: searchParams.get('diretoria') ?? '',
    equipe: searchParams.get('equipe') ?? '',
    roleta: searchParams.get('roleta') ?? '',
    corretor: searchParams.get('corretor') ?? '',
  }
}

export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams)
  const view =
    request.nextUrl.searchParams.get('view') === 'overview'
      ? 'overview'
      : 'full'

  if (!filters) {
    return NextResponse.json(
      { error: 'Informe dateFrom e dateTo' },
      { status: 400 }
    )
  }

  if (isBitrixPaused()) {
    return NextResponse.json(
      { error: BITRIX_PAUSED_MESSAGE },
      { status: bitrixRouteErrorStatus(BITRIX_PAUSED_MESSAGE) }
    )
  }

  try {
    const data = await getCachedDashboard(filters, view)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `private, max-age=${DASHBOARD_SYNC_SECONDS}, stale-while-revalidate=${DASHBOARD_SYNC_SECONDS}`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar dashboard'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
