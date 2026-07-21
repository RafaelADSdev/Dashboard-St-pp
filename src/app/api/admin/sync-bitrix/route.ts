import { NextResponse } from 'next/server'
import { bitrixRouteErrorStatus } from '@/lib/server/bitrixPaused'
import { syncBitrixToSupabase } from '@/lib/server/syncBitrixToSupabase'
import { requireAdminUser } from '@/lib/supabase/access'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: 'Origem da requisição não permitida.' },
      { status: 403 }
    )
  }

  const auth = await requireAdminUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await syncBitrixToSupabase()
    return NextResponse.json(
      {
        ...result,
        message: result.skipped
          ? 'Já existe uma sincronização em andamento.'
          : `${result.dealsSynced} negócio(s) sincronizado(s).`,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro ao sincronizar Bitrix'
    return NextResponse.json(
      { error: message },
      { status: bitrixRouteErrorStatus(message) }
    )
  }
}
