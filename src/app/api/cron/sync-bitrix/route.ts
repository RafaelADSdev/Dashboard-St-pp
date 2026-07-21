import { NextResponse } from 'next/server'
import { syncBitrixToSupabase } from '@/lib/server/syncBitrixToSupabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim()
  return Boolean(cronSecret && request.headers.get('authorization') === `Bearer ${cronSecret}`)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const result = await syncBitrixToSupabase({
      forceFull: url.searchParams.get('full') === '1',
      reconcileFrom: url.searchParams.get('from') ?? undefined,
      reconcileTo: url.searchParams.get('to') ?? undefined,
    })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar Bitrix'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
