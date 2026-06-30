import { NextResponse } from 'next/server'
import { buildOrgPreview } from '@/lib/orgPreview'
import { getCachedOrgStructure } from '@/lib/server/cachedBitrix'
import {
  BITRIX_PAUSED_MESSAGE,
  bitrixRouteErrorStatus,
  isBitrixPaused,
} from '@/lib/server/bitrixPaused'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  if (isBitrixPaused()) {
    return NextResponse.json(
      { error: BITRIX_PAUSED_MESSAGE },
      { status: bitrixRouteErrorStatus(BITRIX_PAUSED_MESSAGE) }
    )
  }

  try {
    const org = await getCachedOrgStructure()
    return NextResponse.json(buildOrgPreview(org), {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar estrutura'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
