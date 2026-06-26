import { NextResponse } from 'next/server'
import { buildOrgPreview } from '@/lib/orgPreview'
import { getCachedOrgStructure } from '@/lib/server/cachedBitrix'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const org = await getCachedOrgStructure()
    return NextResponse.json(buildOrgPreview(org), {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar estrutura'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
