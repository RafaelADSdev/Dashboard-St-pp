import { NextResponse, type NextRequest } from 'next/server'
import type { FilterParams } from '@/api/types'
import { getCachedDashboard } from '@/lib/server/getCachedDashboard'

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
    const data = await getCachedDashboard(filters)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar dashboard'
    const status = message.includes('operation time limit') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
