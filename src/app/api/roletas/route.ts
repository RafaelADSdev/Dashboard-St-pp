import { NextResponse } from 'next/server'
import { getCachedStuppRoletas } from '@/lib/server/cachedBitrix'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const roletas = await getCachedStuppRoletas()
    return NextResponse.json({ roletas }, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar roletas'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
