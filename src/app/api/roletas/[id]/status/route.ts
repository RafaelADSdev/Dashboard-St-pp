import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { updateRoletaStatus } from '@/api/bitrixRoletaMutations'
import type { RoletaOperationalStatus } from '@/lib/roletaStatus'
import { requireUserPermission } from '@/lib/supabase/access'
import { getMetaBitrixWebhookCandidates } from '@/lib/server/bitrixWebhook'
import { invalidateDistributedRoletasCatalog } from '@/lib/server/cachedBitrix'
import {
  BITRIX_PAUSED_MESSAGE,
  bitrixRouteErrorStatus,
  isBitrixPaused,
} from '@/lib/server/bitrixPaused'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_STATUSES: RoletaOperationalStatus[] = ['ativa', 'nova', 'suspensa']

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (isBitrixPaused()) {
    return NextResponse.json(
      { error: BITRIX_PAUSED_MESSAGE },
      { status: bitrixRouteErrorStatus(BITRIX_PAUSED_MESSAGE) }
    )
  }

  const auth = await requireUserPermission('roleta_status')
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await context.params
    const body = (await request.json()) as { status?: RoletaOperationalStatus }

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: 'status deve ser ativa, nova ou suspensa' },
        { status: 400 }
      )
    }

    const webhookUrl = getMetaBitrixWebhookCandidates()
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Configure BITRIX_WEBHOOK_URL no .env' },
        { status: 500 }
      )
    }

    await updateRoletaStatus(webhookUrl, id, body.status)
    await invalidateDistributedRoletasCatalog()
    revalidateTag('stupp-roletas-catalog', 'max')

    return NextResponse.json({ ok: true, status: body.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar status da roleta'
    return NextResponse.json({ error: message }, { status: bitrixRouteErrorStatus(message) })
  }
}
